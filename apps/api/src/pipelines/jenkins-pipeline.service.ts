import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../infrastructure/opensearch.service';
import {
  IPipelineProvider,
  PipelineData,
  Workflow,
  WorkflowRun,
  Job,
} from './interfaces/pipeline-provider.interface';

@Injectable()
export class JenkinsPipelineService implements IPipelineProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opensearch: OpenSearchService,
  ) {}

  async fetchWorkflows(repoIdentifier: string): Promise<any> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ repositoryUrl: repoIdentifier }, { id: repoIdentifier }],
        provider: 'jenkins',
      },
    });

    if (!project) return { workflows: [] };

    return {
      workflows: [
        {
          id: 'jenkins-pipeline',
          name: project.name,
          path: 'Jenkinsfile',
          state: 'active',
        },
      ],
    };
  }

  async fetchWorkflowRuns(
    workflowId: string | number,
    limit: number = 10,
  ): Promise<any> {
    // For Jenkins, we don't have multiple workflows usually in this push model
    // We return runs for the project associated with this "workflow"
    return [];
  }

  async fetchRunLogs(runId: string | number): Promise<any> {
    return { logs: 'Jenkins logs are currently streaming via build status.' };
  }

  async fetchAllPipelineData(
    userId: string,
    repoIdentifier: string,
  ): Promise<PipelineData> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ repositoryUrl: repoIdentifier }, { id: repoIdentifier }],
        provider: 'jenkins',
      },
      include: {
        pipelines: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            jobs: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(
        `Jenkins project not found: ${repoIdentifier}`,
      );
    }

    const workflowRuns: WorkflowRun[] = await Promise.all(
      project.pipelines.map(async (p) => {
        const jobs = await Promise.all(
          p.jobs.map(async (j) => {
            // Fetch logs from OpenSearch
            let logs = 'No logs available for this job.';
            try {
              const searchResult = (await this.opensearch.searchLogs(
                project.id,
                j.id,
              )) as any;
              const hits =
                searchResult.body?.hits?.hits || searchResult.hits?.hits; // Handle different client response versions
              if (hits && hits.length > 0) {
                logs = hits[0]._source.message;
              }
            } catch (e) {
              console.error(
                `[JenkinsPipelineService] Failed to fetch logs from OpenSearch for job ${j.id}`,
                e,
              );
            }

            return {
              id: j.id,
              name: j.name,
              status: j.status,
              conclusion: j.status,
              startedAt: j.startedAt
                ? j.startedAt.toISOString()
                : new Date().toISOString(),
              completedAt: j.finishedAt ? j.finishedAt.toISOString() : null,
              logs: logs,
            };
          }),
        );

        return {
          id: p.id,
          status: p.status,
          conclusion: p.status,
          branch: p.branch || 'unknown',
          commitSha: p.commitSha || 'unknown',
          triggeredAt: p.startedAt
            ? p.startedAt.toISOString()
            : new Date().toISOString(),
          completedAt: p.finishedAt ? p.finishedAt.toISOString() : null,
          runNumber: parseInt(p.externalId || '0'),
          event: p.eventType || 'push',
          jobs: jobs,
        };
      }),
    );

    const workflows: Workflow[] = [
      {
        id: 'jenkins-main',
        name: 'Jenkins Pipeline',
        path: 'Jenkinsfile',
        state: 'active',
        content:
          (project.pipelines[0] as any)?.workflowContent ||
          `// Jenkins Pipeline for ${project.name}\npipeline {\n  agent any\n  // ...\n}`,
        recentRuns: workflowRuns,
      },
    ];

    return {
      repository: {
        id: project.id,
        name: project.name,
        fullName: project.repositoryUrl,
        provider: 'jenkins',
      },
      workflows,
      summary: {
        totalWorkflows: 1,
        totalRuns: project.pipelines.length,
        latestRunStatus: project.pipelines[0]?.status,
      },
    };
  }

  async fetchWorkflowGraph(
    userId: string,
    projectName: string,
    runId: string,
  ): Promise<any> {
    // Find the pipeline run by ID
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: runId },
      include: {
        jobs: {
          orderBy: { startedAt: 'asc' }, // Ensure jobs are ordered by start time
        },
        project: true,
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline run not found: ${runId}`);
    }

    const graph: Record<string, any> = {};
    const executionOrder: string[] = [];

    // Build graph nodes from jobs
    // Jenkins jobs in our DB are linear, so we can chain them
    pipeline.jobs.forEach((job, index) => {
      const jobName = job.name;
      executionOrder.push(jobName);

      // Determine dependencies (previous job in the list)
      const dependencies = index > 0 ? [pipeline.jobs[index - 1].name] : [];

      graph[jobName] = {
        id: job.id,
        name: jobName,
        status: job.status,
        conclusion: job.status, // Jenkins status maps to conclusion
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.finishedAt?.toISOString(),
        dependencies,
        steps: [], // Jenkins jobs don't granularly break down steps in our current model
        type: 'job',
      };
    });

    // Calculate total duration
    const startTimes = pipeline.jobs
      .filter((j) => j.startedAt)
      .map((j) => j.startedAt!.getTime());
    const endTimes = pipeline.jobs
      .filter((j) => j.finishedAt)
      .map((j) => j.finishedAt!.getTime());

    const totalDuration =
      startTimes.length > 0 && endTimes.length > 0
        ? Math.max(...endTimes) - Math.min(...startTimes)
        : 0;

    return {
      runId,
      workflowName: pipeline.project.name,
      branch: pipeline.branch,
      status: pipeline.status,
      conclusion: pipeline.status,
      createdAt: pipeline.startedAt?.toISOString(),
      updatedAt: pipeline.finishedAt?.toISOString(),
      graph: {
        jobs: graph,
        executionOrder,
        totalDuration,
      },
    };
  }
}
