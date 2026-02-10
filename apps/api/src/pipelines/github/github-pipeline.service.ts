import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { GithubAppService } from '../../integrations/github-app.service';
import {
  IPipelineProvider,
  PipelineData,
  Workflow,
  WorkflowRun,
  Job,
} from '../interfaces/pipeline-provider.interface';

@Injectable()
export class GithubPipelineService implements IPipelineProvider {
  constructor(private readonly githubAppService: GithubAppService) {}

  /**
   * Main method: Fetch all pipeline data for a repository
   */
  async fetchAllPipelineData(
    userId: string,
    repoIdentifier: string,
  ): Promise<PipelineData> {
    try {
      // Parse repo identifier (format: "owner/repo" or "repoId")
      const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);

      // Get authenticated Octokit instance for this user's installation
      const octokit = await this.getAuthenticatedOctokit(userId, owner, repo);

      // Fetch repository info
      const repoInfo = await this.fetchRepositoryInfo(octokit, owner, repo);

      // Fetch all workflows using the authenticated octokit
      const { data: workflowsData } = await octokit.actions.listRepoWorkflows({
        owner,
        repo,
      });

      const workflows: Workflow[] = workflowsData.workflows.map((wf) => ({
        id: wf.id,
        name: wf.name,
        path: wf.path,
        state: wf.state,
        content: '', // Will be populated later
        recentRuns: [],
      }));

      let totalRuns = 0;
      let latestRunStatus: string | undefined;
      let latestRunDate: Date | null = null;

      // For each workflow, fetch recent runs and their jobs (PARALLELIZED)
      const workflowPromises = workflows.map(async (workflow) => {
        // Fetch workflow file content and runs in parallel
        const [content, runs] = await Promise.all([
          this.fetchWorkflowFileContent(octokit, owner, repo, workflow.path),
          this.fetchWorkflowRunsDetailed(
            octokit,
            owner,
            repo,
            workflow.id as number,
            10,
          ),
        ]);

        workflow.content = content;

        // Fetch jobs for all runs in parallel
        const runsWithJobsPromises = runs.map(async (run) => {
          const jobs = await this.fetchRunJobs(
            octokit,
            owner,
            repo,
            run.id as number,
          );

          // Fetch logs for all jobs in parallel
          const jobsWithLogs = await Promise.all(
            jobs.map(async (job) => ({
              ...job,
              logs: await this.fetchJobLogs(
                octokit,
                owner,
                repo,
                job.id as number,
              ),
            })),
          );

          return {
            ...run,
            jobs: jobsWithLogs,
          };
        });

        const runsWithJobs = await Promise.all(runsWithJobsPromises);

        // Track latest run and total runs
        for (const run of runsWithJobs) {
          totalRuns++;
          const runDate = new Date(run.triggeredAt);
          if (!latestRunDate || runDate > latestRunDate) {
            latestRunDate = runDate;
            latestRunStatus = run.status === null ? undefined : run.status;
          }
        }

        return {
          ...workflow,
          recentRuns: runsWithJobs,
        };
      });

      const workflowsWithRuns = await Promise.all(workflowPromises);

      return {
        repository: {
          id: repoInfo.id,
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          provider: 'github',
        },
        workflows: workflowsWithRuns,
        summary: {
          totalWorkflows: workflows.length,
          totalRuns,
          latestRunStatus,
        },
      };
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      throw new InternalServerErrorException(
        `Failed to fetch pipeline data: ${error.message}`,
      );
    }
  }

  /**
   * Fetch workflows for a repository
   */
  async fetchWorkflows(
    repoIdentifier: string,
    userId?: string,
  ): Promise<Workflow[]> {
    const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
    const octokit = await this.getAuthenticatedOctokit(
      userId || '',
      owner,
      repo,
    );

    const { data } = await octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });

    return data.workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      path: wf.path,
      state: wf.state,
      recentRuns: [], // Will be populated later
    }));
  }

  /**
   * Fetch workflow runs for a specific workflow
   */
  async fetchWorkflowRuns(
    workflowId: string | number,
    limit: number = 10,
  ): Promise<WorkflowRun[]> {
    // We need repo context, will be called from fetchAllPipelineData
    // This is a helper method, actual implementation in fetchAllPipelineData
    return [];
  }

  /**
   * Fetch logs for a specific run
   */
  async fetchRunLogs(runId: string | number): Promise<string> {
    // Will be implemented when needed
    return '';
  }

  /**
   * Helper: Get authenticated Octokit instance
   */
  private async getAuthenticatedOctokit(
    userId: string,
    owner: string,
    repo: string,
  ): Promise<Octokit> {
    try {
      // Get installation token for this repository
      const tokenData = await this.githubAppService.getInstallationTokenForRepo(
        userId,
        `${owner}/${repo}`,
      );

      return new Octokit({
        auth: tokenData.token,
      });
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to authenticate with GitHub: ${error.message}`,
      );
    }
  }

  /**
   * Helper: Parse repository identifier
   */
  private parseRepoIdentifier(repoIdentifier: string): {
    owner: string;
    repo: string;
  } {
    const parts = repoIdentifier.split('/');
    if (parts.length !== 2) {
      throw new Error(
        'Invalid repository identifier. Expected format: "owner/repo"',
      );
    }
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Helper: Fetch repository information
   */
  private async fetchRepositoryInfo(
    octokit: Octokit,
    owner: string,
    repo: string,
  ) {
    try {
      const { data } = await octokit.repos.get({ owner, repo });
      return data;
    } catch (error) {
      throw new NotFoundException(`Repository ${owner}/${repo} not found`);
    }
  }

  /**
   * Helper: Fetch workflow runs with detailed implementation
   */
  private async fetchWorkflowRunsDetailed(
    octokit: Octokit,
    owner: string,
    repo: string,
    workflowId: number,
    limit: number = 10,
  ): Promise<WorkflowRun[]> {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      per_page: limit,
    });

    return data.workflow_runs.map((run) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch || '',
      commitSha: run.head_sha,
      commitMessage: run.head_commit?.message,
      triggeredAt: run.created_at,
      completedAt: run.updated_at,
      runNumber: run.run_number,
      event: run.event,
      jobs: [], // Will be populated separately
    }));
  }

  /**
   * Helper: Fetch jobs for a workflow run
   */
  private async fetchRunJobs(
    octokit: Octokit,
    owner: string,
    repo: string,
    runId: number,
  ): Promise<Job[]> {
    try {
      const { data } = await octokit.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      return data.jobs.map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      }));
    } catch (error) {
      console.error(`Error fetching jobs for run ${runId}:`, error);
      return [];
    }
  }

  /**
   * Helper: Fetch logs for a specific job
   */
  private async fetchJobLogs(
    octokit: Octokit,
    owner: string,
    repo: string,
    jobId: number,
  ): Promise<string> {
    try {
      const { data } = await octokit.actions.downloadJobLogsForWorkflowRun({
        owner,
        repo,
        job_id: jobId,
      });

      return data as unknown as string;
    } catch (error) {
      console.error(`Error fetching logs for job ${jobId}:`, error);
      return '';
    }
  }

  /**
   * Helper: Fetch workflow file content from repository
   */
  private async fetchWorkflowFileContent(
    octokit: Octokit,
    owner: string,
    repo: string,
    workflowPath: string,
  ): Promise<string> {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: workflowPath,
      });

      // If it's a file, decode the content from base64
      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return '';
    } catch (error) {
      console.error(
        `[GithubPipelineService] Error fetching workflow file ${workflowPath}:`,
        {
          message: error.message,
          status: error.status,
          response: error.response?.data,
        },
      );
      return '';
    }
  }

  /**
   * Updated fetchWorkflows to include the full implementation
   */
  async fetchWorkflowsWithRuns(
    userId: string,
    owner: string,
    repo: string,
    limit: number = 10,
  ): Promise<Workflow[]> {
    const octokit = await this.getAuthenticatedOctokit(userId, owner, repo);

    const { data } = await octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });

    const workflows: Workflow[] = [];

    for (const wf of data.workflows) {
      const runs = await this.fetchWorkflowRunsDetailed(
        octokit,
        owner,
        repo,
        wf.id,
        limit,
      );

      workflows.push({
        id: wf.id,
        name: wf.name,
        path: wf.path,
        state: wf.state,
        recentRuns: runs,
      });
    }

    return workflows;
  }

  /**
   * Fetch workflow graph for a specific run
   * Returns job dependencies and execution details for visualization
   */
  async fetchWorkflowGraph(
    userId: string,
    repoIdentifier: string,
    runId: number,
  ): Promise<any> {
    try {
      const { owner, repo } = this.parseRepoIdentifier(repoIdentifier);
      const octokit = await this.getAuthenticatedOctokit(userId, owner, repo);

      // Get run details to find workflow path
      const { data: runData } = await octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      // Get jobs for this run
      const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      // Get workflow file content to understand dependencies
      const workflowContent = await this.fetchWorkflowFileContent(
        octokit,
        owner,
        repo,
        runData.path,
      );

      // Parse workflow file
      const workflowYaml = this.parseWorkflowYaml(workflowContent);

      // Build graph with dependencies
      const graph = await this.buildWorkflowGraph(jobsData.jobs, workflowYaml);

      return {
        runId,
        workflowName: runData.name,
        branch: runData.head_branch,
        status: runData.status,
        conclusion: runData.conclusion,
        createdAt: runData.created_at,
        updatedAt: runData.updated_at,
        graph,
      };
    } catch (error) {
      console.error(`Error fetching workflow graph for run ${runId}:`, error);
      throw new InternalServerErrorException(
        `Failed to fetch workflow graph: ${error.message}`,
      );
    }
  }

  /**
   * Helper: Parse YAML workflow content
   */
  private parseWorkflowYaml(content: string): any {
    try {
      const yaml = require('js-yaml');
      return yaml.load(content);
    } catch (error) {
      console.error('Error parsing workflow YAML:', error);
      return { jobs: {} };
    }
  }

  /**
   * Helper: Build workflow graph from jobs and workflow definition
   */
  private async buildWorkflowGraph(
    jobs: any[],
    workflowYaml: any,
  ): Promise<any> {
    const graph: Record<string, any> = {};

    // Get job definitions from workflow file
    const jobDefinitions = workflowYaml.jobs || {};

    // Build node for each job
    for (const job of jobs) {
      const jobName = job.name;
      const jobDef = jobDefinitions[jobName] || {};

      // Extract dependencies from 'needs' field
      const dependencies = Array.isArray(jobDef.needs)
        ? jobDef.needs
        : jobDef.needs
          ? [jobDef.needs]
          : [];

      // Steps from the job object (GitHub API includes steps in listJobsForWorkflowRun response)
      const steps = Array.isArray(job.steps)
        ? (job.steps || []).map((step: any) => ({
            name: step.name,
            status: step.status,
            conclusion: step.conclusion,
            number: step.number,
          }))
        : [];

      graph[jobName] = {
        id: job.id,
        name: jobName,
        status: job.status,
        conclusion: job.conclusion,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        dependencies, // This is the job dependency list
        steps, // Steps array
      };
    }

    // Calculate execution order using topological sort
    const executionOrder = this.topologicalSort(graph);

    // Calculate total duration
    const allJobs = Object.values(graph) as any[];
    const startTimes = allJobs
      .filter((j) => j.startedAt)
      .map((j) => new Date(j.startedAt).getTime());
    const endTimes = allJobs
      .filter((j) => j.completedAt)
      .map((j) => new Date(j.completedAt).getTime());

    const totalDuration =
      startTimes.length > 0 && endTimes.length > 0
        ? Math.max(...endTimes) - Math.min(...startTimes)
        : undefined;

    console.log('[GithubPipelineService] Built workflow graph:', {
      jobCount: Object.keys(graph).length,
      jobs: Object.keys(graph),
      executionOrder,
    });

    return {
      jobs: graph,
      executionOrder,
      totalDuration,
    };
  }

  /**
   * Helper: Topological sort for job execution order
   */
  private topologicalSort(graph: Record<string, any>): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (jobName: string) => {
      if (visited.has(jobName)) return;
      visited.add(jobName);

      // Visit dependencies first
      const job = graph[jobName];
      if (job.dependencies && Array.isArray(job.dependencies)) {
        for (const dep of job.dependencies) {
          visit(dep);
        }
      }

      order.push(jobName);
    };

    // Visit all jobs
    for (const jobName of Object.keys(graph)) {
      visit(jobName);
    }

    return order;
  }
}
