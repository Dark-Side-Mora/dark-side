/**
 * Base interface for all CI/CD pipeline providers
 * Implement this interface for GitHub, Jenkins, GitLab, etc.
 */
export interface IPipelineProvider {
  /**
   * Fetch all workflows/pipelines for a repository
   */
  fetchWorkflows(repoIdentifier: string): Promise<any>;

  /**
   * Fetch workflow runs for a specific workflow
   */
  fetchWorkflowRuns(workflowId: string | number, limit?: number): Promise<any>;

  /**
   * Fetch logs for a specific run/job
   */
  fetchRunLogs(runId: string | number): Promise<any>;

  /**
   * Fetch all pipeline data at once (workflows, runs, jobs, logs)
   * This is the main method that aggregates all data
   */
  fetchAllPipelineData(
    userId: string,
    repoIdentifier: string,
  ): Promise<PipelineData>;
}

/**
 * Standardized pipeline data structure
 * All providers should return data in this format
 */
export interface PipelineData {
  repository: {
    id: number | string;
    name: string;
    fullName: string;
    provider: string;
  };
  workflows: Workflow[];
  summary: {
    totalWorkflows: number;
    totalRuns: number;
    latestRunStatus?: string;
  };
}

export interface Workflow {
  id: number | string;
  name: string;
  path: string;
  state: string;
  content?: string; // YAML/workflow file content
  recentRuns: WorkflowRun[];
}

export interface WorkflowRun {
  id: number | string;
  status: string | null;
  conclusion: string | null;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  triggeredAt: string;
  completedAt: string | null;
  runNumber: number;
  event: string;
  jobs: Job[];
}

export interface Job {
  id: number | string;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  logs?: string;
}

/**
 * Workflow graph structures for frontend visualization
 */
export interface WorkflowStep {
  name: string;
  status: string | null;
  conclusion: string | null;
  number?: number;
}

export interface WorkflowJobNode {
  id: number | string;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  dependencies: string[]; // List of job names this job depends on
  steps: WorkflowStep[];
}

export interface WorkflowGraph {
  runId: number | string;
  jobs: {
    [jobName: string]: WorkflowJobNode;
  };
  executionOrder: string[];
  totalDuration?: number; // in milliseconds
}
