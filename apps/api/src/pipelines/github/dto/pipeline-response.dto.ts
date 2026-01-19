export class PipelineResponseDto {
  repository: {
    id: number | string;
    name: string;
    fullName: string;
    provider: string;
  };

  workflows: WorkflowDto[];

  summary: {
    totalWorkflows: number;
    totalRuns: number;
    latestRunStatus?: string;
  };
}

export class WorkflowDto {
  id: number | string;
  name: string;
  path: string;
  state: string;
  content?: string; // YAML/workflow file content
  recentRuns: WorkflowRunDto[];
}

export class WorkflowRunDto {
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
  jobs: JobDto[];
}

export class JobDto {
  id: number | string;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  logs?: string;
}
