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

    // 2. Resolve Workspace (Organization)
    // For Jenkins, we assume the token is linked to a specific user and their organizations.
    // In our simplified "Push-to-Provision" model, we'll look for an organization
    // that the user owns or belongs to with 'jenkins' as primary provider.
    const organization = await (this.prisma.organization as any).findFirst({
      where: {
        provider: 'jenkins',
        members: {
          some: {
            userId: connection.userId,
          },
        },
      },
    });

    if (!organization) {
      console.error(
        '[JenkinsService] No Jenkins workspace found for user:',
        connection.userId,
      );
      throw new NotFoundException(
        'No Jenkins workspace found. Please create one first.',
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
    if (payload.jobs && Array.isArray(payload.jobs)) {
      for (const jobData of payload.jobs) {
        const job = await (this.prisma.job as any).create({
          data: {
            pipelineId: pipeline.id,
            name: jobData.name,
            status: this.mapJenkinsStatus(jobData.status),
            // Log explicitly NOT stored in Postgres anymore
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        });

        // Index detailed logs in OpenSearch/Bonsai
        if (jobData.logs) {
          await this.opensearch.indexLog(project.id, {
            jobId: job.id,
            pipelineId: pipeline.id,
            jobName: job.name,
            message: jobData.logs,
            status: job.status,
          });
        }
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
}
