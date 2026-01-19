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

      const workflowsWithRuns: Workflow[] = [];

      let totalRuns = 0;
      let latestRunStatus: string | undefined;
      let latestRunDate: Date | null = null;

      // For each workflow, fetch recent runs and their jobs
      for (const workflow of workflows) {
        // Fetch workflow file content
        workflow.content = await this.fetchWorkflowFileContent(
          octokit,
          owner,
          repo,
          workflow.path,
        );

        const runs = await this.fetchWorkflowRunsDetailed(
          octokit,
          owner,
          repo,
          workflow.id as number,
          10,
        );
        const runsWithJobs: WorkflowRun[] = [];

        for (const run of runs) {
          const jobs = await this.fetchRunJobs(
            octokit,
            owner,
            repo,
            run.id as number,
          );

          for (const job of jobs) {
            job.logs = await this.fetchJobLogs(
              octokit,
              owner,
              repo,
              job.id as number,
            );
          }

          runsWithJobs.push({
            ...run,
            jobs,
          });

          totalRuns++;

          // Track latest run
          const runDate = new Date(run.triggeredAt);
          if (!latestRunDate || runDate > latestRunDate) {
            latestRunDate = runDate;
            latestRunStatus = run.status === null ? undefined : run.status;
          }
        }

        workflowsWithRuns.push({
          ...workflow,
          recentRuns: runsWithJobs,
        });
      }

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
      console.error(`Error fetching workflow file ${workflowPath}:`, error);
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
}
