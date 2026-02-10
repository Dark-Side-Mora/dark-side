import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface WorkflowGraphData {
  jobs: Record<
    string,
    {
      id: string;
      name: string;
      status: string;
      conclusion: string | null;
      startedAt: string;
      completedAt: string;
      dependencies: string[];
      steps: Array<{
        name: string;
        status?: string;
        conclusion?: string | null;
      }>;
    }
  >;
  executionOrder: string[];
  totalDuration?: number;
}

export async function fetchWorkflowGraph(
  repoIdentifier: string,
  runId: number,
  provider: string = "github",
): Promise<WorkflowGraphData | null> {
  try {
    const encodedRepo = encodeURIComponent(repoIdentifier);
    const url = `${API_URL}/pipelines/${provider}/${encodedRepo}/runs/${runId}/graph`;

    const response = await apiGet(url);

    if (response && typeof response === "object") {
      // Handle both wrapped and unwrapped responses
      if ("graph" in response) {
        return (response as any).graph;
      }
      if ("jobs" in response && "executionOrder" in response) {
        return response as WorkflowGraphData;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching workflow graph:", error);
    return null;
  }
}
