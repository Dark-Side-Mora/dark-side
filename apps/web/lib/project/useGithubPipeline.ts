import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface PipelineData {
  repository: {
    id: number;
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
  id: number;
  name: string;
  path: string;
  state: string;
  content?: string;
  recentRuns: WorkflowRun[];
}
export interface WorkflowRun {
  id: number;
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
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  logs?: string;
}

export function useGithubPipeline(userId: string) {
  const [repos, setRepos] = useState<{ id: string; fullName: string }[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch repos for user
  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiGet(
        `${API_URL}/integrations/github-app/installations`,
      );
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in data &&
        typeof (data as any).data === "object" &&
        (data as any).data !== null &&
        "installations" in (data as any).data
      ) {
        const allRepos = (data as any).data.installations.flatMap((inst: any) =>
          inst.repositories.map((r: any) => ({
            id: r.id,
            fullName: r.fullName,
          })),
        );
        setRepos(allRepos);
        if (allRepos.length > 0) setSelectedRepo(allRepos[0].fullName);
      } else {
        setRepos([]);
      }
    } catch (e) {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch pipeline data for selected repo
  const fetchPipeline = useCallback(
    async (repo?: string) => {
      if (!repo && !selectedRepo) return;
      setLoading(true);
      setMessage("");
      try {
        const encodedRepo = encodeURIComponent(repo || selectedRepo);
        const data = await apiGet(
          `${API_URL}/pipelines/github/${encodedRepo}/data?limit=5`,
        );
        if (
          typeof data === "object" &&
          data !== null &&
          "data" in data &&
          (data as any).data
        ) {
          setPipelineData((data as any).data);
          setMessage("");
        } else {
          setPipelineData(null);
          setMessage("No pipeline data found");
        }
      } catch (e) {
        setPipelineData(null);
        setMessage("Error fetching pipeline data");
      } finally {
        setLoading(false);
      }
    },
    [selectedRepo, userId],
  );

  useEffect(() => {
    fetchRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (selectedRepo) fetchPipeline(selectedRepo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo, userId]);

  return {
    repos,
    selectedRepo,
    setSelectedRepo,
    pipelineData,
    loading,
    message,
    fetchRepos,
    fetchPipeline,
  };
}
