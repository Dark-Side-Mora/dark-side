import { useState, useCallback, useEffect } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface TrendDataPoint {
  date: string;
  successRate: number;
  totalBuilds: number;
}

export interface RecentActivityItem {
  id: string;
  type: "pipeline" | "security" | "project";
  title: string;
  description: string;
  status: string;
  timestamp: string;
  projectName?: string;
  severity?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeAlerts: number;
  buildVolume: number;
  pipelineHealthPercentage: number;
  recentActivity: RecentActivityItem[];
  reliabilityTrend: TrendDataPoint[];
  optimizationSuggestions: OptimizationSuggestion[];
  resourceConsumption: ResourceConsumption;
}

export interface OptimizationSuggestion {
  id: string;
  type: "performance" | "security" | "cost" | "reliability";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  estimatedSavings?: string;
}

export interface ResourceConsumption {
  averageBuildDuration: number;
  totalBuildTime: number;
  peakBuildTime: number;
  buildTimeByProject: BuildTimeByProject[];
}

export interface BuildTimeByProject {
  projectName: string;
  averageDuration: number;
  totalBuilds: number;
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<DashboardMetrics>(
        `${API_URL}/dashboard/metrics`,
      );
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch dashboard metrics",
      );
      console.error("Error fetching dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<DashboardMetrics>(
        `${API_URL}/dashboard/metrics?refresh=true`,
      );
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to refresh dashboard metrics",
      );
      console.error("Error refreshing dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    refreshMetrics,
  };
}
