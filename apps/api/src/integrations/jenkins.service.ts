import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../infrastructure/opensearch.service';

@Injectable()
export class JenkinsService {
  constructor(
    private prisma: PrismaService,
    private opensearch: OpenSearchService,
  ) {}

  async processPushData(payload: any, token: string) {
    console.log(
      '[JenkinsService] Processing build push for:',
      payload.repository,
    );

    // 1. Validate Token
    const connection = await this.prisma.integrationConnection.findFirst({
      where: {
        accessToken: token,
        provider: 'jenkins',
        status: 'active',
      },
      include: {
        organizationAccess: true,
      },
    });

    if (!connection) {
      console.error('[JenkinsService] Invalid or inactive token:', token);
      throw new UnauthorizedException('Invalid Jenkins build token');
    }

    // Resolve Workspace (Organization)
    // First, try to find an organization that already has this project for this user
    let organization: any = null;
    const existingProjectForOrg = await this.prisma.project.findFirst({
      where: {
        repositoryUrl: payload.repository,
        provider: 'jenkins',
        organization: {
          members: {
            some: {
              userId: connection.userId,
            },
          },
        },
      },
      include: {
        organization: true,
      },
    });

    if (existingProjectForOrg) {
      organization = existingProjectForOrg.organization;
      console.log(
        '[JenkinsService] found existing project in organization:',
        organization.id,
      );
    } else {
      // Fallback to the first organization the user belongs to.
      organization = await (this.prisma.organization as any).findFirst({
        where: {
          members: {
            some: {
              userId: connection.userId,
            },
          },
        },
      });
      if (organization) {
        console.log(
          '[JenkinsService] Falling back to first organization:',
          organization.id,
        );
      }
    }

    if (!organization) {
      console.error(
        '[JenkinsService] No organization found for user:',
        connection.userId,
      );
      throw new NotFoundException(
        'No organization found. Please create or join an organization first.',
      );
    }

    // 3. Resolve or Create Project
    let project = await this.prisma.project.findFirst({
      where: {
        organizationId: organization.id,
        repositoryUrl: payload.repository,
        provider: 'jenkins',
      },
    });

    if (!project) {
      console.log(
        '[JenkinsService] Auto-provisioning project:',
        payload.repository,
      );
      project = await this.prisma.project.create({
        data: {
          name: payload.repository.split('/').pop(),
          repositoryUrl: payload.repository,
          provider: 'jenkins',
          organizationId: organization.id,
          userId: connection.userId,
        },
      });
    }

    // 4. Create Pipeline Run
    const pipeline = await (this.prisma.pipeline as any).create({
      data: {
        projectId: project.id,
        externalId: payload.runId || payload.buildNumber,
        status: this.mapJenkinsStatus(payload.status),
        branch: payload.branch,
        commitSha: payload.commitSha,
        eventType: 'push',
        workflowContent: payload.workflowContent, // Store actual Jenkinsfile if provided
        startedAt: new Date(), // Jenkins pushes at the end, so we approximate
        finishedAt: new Date(),
      },
    });

    // 5. Create Jobs and Index Logs in OpenSearch
    // HACK: Jenkins plugin sends a single "Build" job. We try to parse stages from logs.
    let jobsToCreate: { name: string; status: string; logs: string }[] = [];
    const fullLog =
      payload.jobs && payload.jobs.length > 0 ? payload.jobs[0].logs : '';

    if (fullLog) {
      const stages = this.extractStagesFromLogs(fullLog);
      if (stages.length > 0) {
        console.log(
          `[JenkinsService] Parsed ${stages.length} stages from logs for ${payload.repository}`,
        );
        jobsToCreate = stages.map((stage) => ({
          name: stage.name,
          status: 'success', // Default to success, we can't easily parse status per stage from text logs
          logs: stage.logs,
        }));

        // If the overall build failed, mark the last stage as failed (simple heuristic)
        if (
          this.mapJenkinsStatus(payload.status) === 'failed' &&
          jobsToCreate.length > 0
        ) {
          jobsToCreate[jobsToCreate.length - 1].status = 'failed';
        }
      }
    }

    // If no stages parsed, fallback to payload jobs
    if (
      jobsToCreate.length === 0 &&
      payload.jobs &&
      Array.isArray(payload.jobs)
    ) {
      jobsToCreate = payload.jobs;
    }

    for (const jobData of jobsToCreate) {
      try {
        console.log(`[JenkinsService] Creating job: ${jobData.name}`);
        const job = await (this.prisma.job as any).create({
          data: {
            pipelineId: pipeline.id,
            name: jobData.name,
            status: this.mapJenkinsStatus(jobData.status),
            // Log explicitly NOT stored in Postgres anymore
            startedAt: new Date(), // We don't have exact start times for stages from logs
            finishedAt: new Date(),
          },
        });
        console.log(`[JenkinsService] Job created: ${job.id}`);

        // Index detailed logs in OpenSearch/Bonsai
        if (jobData.logs) {
          console.log(`[JenkinsService] Indexing logs for job: ${job.id}`);
          await this.opensearch.indexLog(project.id, {
            jobId: job.id,
            pipelineId: pipeline.id,
            jobName: job.name,
            message: jobData.logs,
            status: job.status,
          });
          console.log(`[JenkinsService] Logs indexed for job: ${job.id}`);
        }
      } catch (error) {
        console.error(
          `[JenkinsService] Error creating job/indexing logs for ${jobData.name}:`,
          error,
        );
        // Continue to next job, don't fail the entire request
      }
    }

    return { success: true, pipelineId: pipeline.id };
  }

  async getOrCreateSetupToken(userId: string) {
    let connection = await this.prisma.integrationConnection.findFirst({
      where: {
        userId,
        provider: 'jenkins',
        status: 'active',
      },
    });

    if (!connection) {
      // Create a unique random token for Jenkins pushes
      const token = `cj_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      connection = await this.prisma.integrationConnection.create({
        data: {
          userId,
          provider: 'jenkins',
          accessToken: token,
          status: 'active',
        },
      });
    }

    return {
      token: connection.accessToken,
      endpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/integrations/jenkins/push`,
    };
  }

  private mapJenkinsStatus(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'SUCCESS') return 'success';
    if (s === 'FAILURE' || s === 'FAILED') return 'failed';
    if (s === 'UNSTABLE') return 'unstable';
    if (s === 'ABORTED') return 'cancelled';
    return 'running';
  }

  /**
   * Step 1: Create a pending connection record when user initiates Jenkins connection
   * This tracks the connection attempt so we can sync projects when user returns
   */
  async createPendingConnection(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expire after 1 hour

      // Note: Using a similar pattern to GitHub, but we need to add JenkinsConnectionPending model
      // For now, we'll use IntegrationConnection with metadata to track pending state
      await this.prisma.integrationConnection.upsert({
        where: {
          userId_provider_organizationId: {
            userId,
            provider: 'jenkins',
            organizationId,
          },
        },
        create: {
          userId,
          provider: 'jenkins',
          organizationId,
          accessToken: '', // Will be set when connection completes
          status: 'pending',
          metadata: {
            pendingConnection: true,
            expiresAt: expiresAt.toISOString(),
          },
        },
        update: {
          status: 'pending',
          metadata: {
            pendingConnection: true,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      console.log(
        `[JenkinsService] Created pending connection for user ${userId} in org ${organizationId}`,
      );
    } catch (error) {
      console.error(
        `[JenkinsService] Error creating pending connection: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Step 2 & 3: Sync Jenkins projects for organization
   * 1. Check for pending connection (tracking record)
   * 2. Get existing projects from database for this organization
   * 3. Get Jenkins connections (tokens) for this user
   * 4. Compare and update:
   *    - If DB has projects not associated with active connections: remove them
   *    - If user has new Jenkins connections: they'll create projects via push
   * 5. Clear pending connection record after successful sync
   */
  async syncJenkinsProjectsForOrganization(
    userId: string,
    organizationId: string,
  ): Promise<any> {
    try {
      console.log(
        `[JenkinsService] Starting sync for org ${organizationId} (user: ${userId})`,
      );

      // Step 1: Check for pending connection (tracking record)
      const pendingConnection =
        await this.prisma.integrationConnection.findFirst({
          where: {
            userId,
            provider: 'jenkins',
            organizationId,
            status: 'pending',
          },
        });

      // Step 2: Get existing projects from database for this organization
      const existingProjects = await this.prisma.project.findMany({
        where: {
          organizationId,
          provider: 'jenkins',
        },
      });

      console.log(
        `[JenkinsService] Found ${existingProjects.length} existing Jenkins projects for org ${organizationId}`,
      );

      // Create a set of existing project IDs in THIS organization only
      const existingProjectIds = new Set(existingProjects.map((p) => p.id));

      // Step 3: Get all Jenkins connections (tokens) for this user
      const userConnections = await this.prisma.integrationConnection.findMany({
        where: {
          userId,
          provider: 'jenkins',
          status: 'active',
        },
      });

      console.log(
        `[JenkinsService] Found ${userConnections.length} Jenkins connections for user`,
      );

      const totalNewProjects = 0;
      let totalRemovedProjects = 0;

      // Note: Jenkins uses a push-based model, so we can't actively fetch projects from Jenkins server
      // Instead, projects are created when Jenkins pushes build data to us
      // We'll track connections and clean up projects if connections are removed

      // Collect all project repository URLs from the organization's Jenkins connections
      // Since Jenkins is push-based, we validate that connections exist but don't fetch new projects
      const connectionOrgIds = new Set(
        userConnections
          .filter((c) => c.organizationId)
          .map((c) => c.organizationId as string),
      );

      const toRemove = new Set<string>();

      // Compare - if organization no longer has associated connections, mark projects for removal
      if (!connectionOrgIds.has(organizationId)) {
        for (const projectId of existingProjectIds) {
          toRemove.add(projectId);
        }
      }

      // Delete - only from THIS organization
      for (const projectId of toRemove) {
        const project = await this.prisma.project.findUnique({
          where: { id: projectId },
          include: {
            pipelines: true,
          },
        });

        if (project) {
          // Delete all associated pipelines (cascade will handle jobs and logs)
          for (const pipeline of project.pipelines) {
            await this.prisma.pipeline
              .delete({
                where: { id: pipeline.id },
              })
              .catch(() => {});
          }

          // Delete the project
          await this.prisma.project.delete({
            where: { id: projectId },
          });
          totalRemovedProjects++;
        }
      }

      // For Jenkins, new projects are created via push (processPushData), not pulled
      // If pending connection exists, mark it as active now
      if (pendingConnection) {
        console.log(
          `[JenkinsService] Found pending connection for user ${userId} in org ${organizationId}`,
        );

        // Update connection to active (assumes token was set during setup)
        if (pendingConnection.accessToken) {
          await this.prisma.integrationConnection.update({
            where: { id: pendingConnection.id },
            data: {
              status: 'active',
              metadata: {
                pendingConnection: false,
                activatedAt: new Date().toISOString(),
              },
            },
          });

          console.log(
            `[JenkinsService] Activated connection for user ${userId} in org ${organizationId}`,
          );
        } else {
          console.log(
            `[JenkinsService] Pending connection exists but no token set yet`,
          );
        }
      } else {
        console.log(
          `[JenkinsService] No pending connection found - skipping activation`,
        );
      }

      const summary = {
        userId,
        organizationId,
        totalConnections: userConnections.length,
        totalNewProjects,
        totalRemovedProjects,
        message: `Synced Jenkins projects: added ${totalNewProjects} (via push), removed ${totalRemovedProjects}.`,
        note: 'Jenkins uses push-based integration. New projects will appear when Jenkins pushes build data.',
      };

      console.log(`[JenkinsService] Sync complete: ${JSON.stringify(summary)}`);

      return summary;
    } catch (error) {
      console.error(
        `[JenkinsService] Error in syncJenkinsProjectsForOrganization: ${error.message}`,
      );
      console.error(error);
      throw error;
    }
  }

  /**
   * Helper: Extract stages from Jenkins logs
   * Matches pattern: [Pipeline] { (Stage Name)
   */
  private extractStagesFromLogs(
    logs: string,
  ): { name: string; logs: string }[] {
    const stages: { name: string; logs: string }[] = [];
    if (!logs) return stages;

    const lines = logs.split('\n');
    let currentStage: { name: string; logs: string[] } | null = null;

    // Regex for standard Declarative Pipeline logs
    // Example: [Pipeline] { (Build)
    const stageStartRegex = /\[Pipeline\]\s+\{\s+\((.+?)\)/;

    // Also look for Scripted Pipeline pattern if needed, or other variants
    // But the payload likely has stripped ANSI, so we rely on text.

    for (const line of lines) {
      const match = line.match(stageStartRegex);
      if (match) {
        // Found a new stage start
        if (currentStage) {
          // Push previous stage
          stages.push({
            name: currentStage.name,
            logs: currentStage.logs.join('\n'),
          });
        }
        // Start new stage (capture group 1 is the stage name)
        currentStage = { name: match[1], logs: [] };
      } else {
        if (currentStage) {
          currentStage.logs.push(line);
        }
      }
    }

    // Push the last stage
    if (currentStage) {
      stages.push({
        name: currentStage.name,
        logs: currentStage.logs.join('\n'),
      });
    }

    return stages;
  }
}
