export class DashboardMetricsDto {
  totalProjects: number;
  activeAlerts: number;
  buildVolume: number;
  pipelineHealthPercentage: number;
  recentActivity: RecentActivityItem[];
  reliabilityTrend: TrendDataPoint[];
  optimizationSuggestions: OptimizationSuggestion[];
  resourceConsumption: ResourceConsumption;
}

export class RecentActivityItem {
  id: string;
  type: 'pipeline' | 'security' | 'project';
  title: string;
  description: string;
  status: string;
  timestamp: Date;
  projectName?: string;
  severity?: string;
}

export class TrendDataPoint {
  date: string;
  successRate: number;
  totalBuilds: number;
}

export class OptimizationSuggestion {
  id: string;
  type: 'performance' | 'security' | 'cost' | 'reliability';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: string;
}

export class ResourceConsumption {
  averageBuildDuration: number; // in seconds
  totalBuildTime: number; // in seconds (last 30 days)
  peakBuildTime: number; // in seconds
  buildTimeByProject: BuildTimeByProject[];
}

export class BuildTimeByProject {
  projectName: string;
  averageDuration: number;
  totalBuilds: number;
}
