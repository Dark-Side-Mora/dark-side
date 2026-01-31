import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
  content?: string;
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

export function usePipeline(provider: string = "github") {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(
    async (repoIdentifier: string, currentProvider: string = provider) => {
      if (!repoIdentifier) return;
      setLoading(true);
      setError(null);
      try {
        const encodedRepo = encodeURIComponent(repoIdentifier);
        const res = await apiGet<{ data: PipelineData }>(
          `${API_URL}/pipelines/${currentProvider}/${encodedRepo}/data?limit=10`,
        );

        if (res && (res as any).data) {
          setPipelineData((res as any).data);
        } else {
          setPipelineData(null);
        }
      } catch (err) {
        setPipelineData(null);
        setError(
          err instanceof Error ? err.message : "Failed to fetch pipeline data",
        );
      } finally {
        setLoading(false);
      }
    },
    [provider],
  );

  return {
    pipelineData,
    loading,
    error,
    fetchPipeline,
  };
}
