import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubPipelineService } from '../pipelines/github/github-pipeline.service';
import { JenkinsPipelineService } from '../pipelines/jenkins-pipeline.service';
import { GeminiSecurityService } from '../ai/gemini/gemini-security.service';
import {
  DashboardMetricsDto,
  RecentActivityItem,
  TrendDataPoint,
  OptimizationSuggestion,
  ResourceConsumption,
  BuildTimeByProject,
} from './dto/dashboard-metrics.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubPipelineService: GithubPipelineService,
    private readonly jenkinsPipelineService: JenkinsPipelineService,
    private readonly geminiService: GeminiSecurityService,
  ) {}

  async getDashboardMetrics(userId: string): Promise<DashboardMetricsDto> {
    this.logger.log(`Fetching dashboard metrics for user: ${userId}`);

    // Check for cached metrics
    const cachedMetrics = await this.prisma.dashboardMetricsCache.findUnique({
      where: { userId },
    });

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    // If cache exists and is less than 6 hours old, return cached data
    if (cachedMetrics && cachedMetrics.updatedAt > sixHoursAgo) {
      this.logger.log(
        `Returning cached metrics (age: ${Math.round((now.getTime() - cachedMetrics.updatedAt.getTime()) / 1000 / 60)} minutes)`,
      );
      return {
        totalProjects: cachedMetrics.totalProjects,
        activeAlerts: cachedMetrics.activeAlerts,
        buildVolume: cachedMetrics.buildVolume,
        pipelineHealthPercentage: cachedMetrics.pipelineHealthPercentage,
        recentActivity:
          cachedMetrics.recentActivity as unknown as RecentActivityItem[],
        reliabilityTrend:
          cachedMetrics.reliabilityTrend as unknown as TrendDataPoint[],
        optimizationSuggestions:
          cachedMetrics.optimizationSuggestions as unknown as OptimizationSuggestion[],
        resourceConsumption:
          cachedMetrics.resourceConsumption as unknown as ResourceConsumption,
      };
    }

    this.logger.log('Cache miss or expired, fetching fresh data...');

    // Fetch fresh data
    const metrics = await this.fetchFreshMetrics(userId);

    // Save to cache
    await this.prisma.dashboardMetricsCache.upsert({
      where: { userId },
      create: {
        userId,
        totalProjects: metrics.totalProjects,
        activeAlerts: metrics.activeAlerts,
        buildVolume: metrics.buildVolume,
        pipelineHealthPercentage: metrics.pipelineHealthPercentage,
        recentActivity: metrics.recentActivity as any,
        reliabilityTrend: metrics.reliabilityTrend as any,
        optimizationSuggestions: metrics.optimizationSuggestions as any,
        resourceConsumption: metrics.resourceConsumption as any,
      },
      update: {
        totalProjects: metrics.totalProjects,
        activeAlerts: metrics.activeAlerts,
        buildVolume: metrics.buildVolume,
        pipelineHealthPercentage: metrics.pipelineHealthPercentage,
        recentActivity: metrics.recentActivity as any,
        reliabilityTrend: metrics.reliabilityTrend as any,
        optimizationSuggestions: metrics.optimizationSuggestions as any,
        resourceConsumption: metrics.resourceConsumption as any,
        updatedAt: now,
      },
    });

    this.logger.log('Metrics cached successfully');
    return metrics;
  }

  private async fetchFreshMetrics(
    userId: string,
  ): Promise<DashboardMetricsDto> {
    // Get user's organizations with projects
    const organizations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        projects: {
          include: {
            githubRepositories: true,
          },
        },
      },
    });

    this.logger.log(`Found ${organizations.length} organizations for user`);

    // Fetch real pipeline data from all providers for each project
    const projectsWithPipelines = await Promise.all(
      organizations.flatMap((org) =>
        (org.projects || []).map(async (project) => {
          // GitHub provider
          if (
            project.provider === 'github' &&
            project.githubRepositories?.length > 0
          ) {
            try {
              const repo = project.githubRepositories[0];
              const repoIdentifier = repo.fullName;
              this.logger.log(
                `Fetching GitHub pipeline data for ${repoIdentifier}`,
              );

              const pipelineData =
                await this.githubPipelineService.fetchAllPipelineData(
                  userId,
                  repoIdentifier,
                );

              // Debug: Log the structure of pipeline data
              this.logger.log(
                `Pipeline data for ${repoIdentifier}: ${JSON.stringify({
                  hasWorkflows: !!pipelineData?.workflows,
                  workflowCount: pipelineData?.workflows?.length || 0,
                  sampleWorkflow: pipelineData?.workflows?.[0]
                    ? {
                        name: pipelineData.workflows[0].name,
                        recentRunsCount:
                          pipelineData.workflows[0].recentRuns?.length || 0,
                      }
                    : null,
                })}`,
              );

              return {
                project,
                pipelineData,
              };
            } catch (error) {
              this.logger.error(
                `Failed to fetch GitHub pipeline data for project ${project.name}: ${error.message}`,
              );
              return null;
            }
          }
          // Jenkins provider
          else if (project.provider === 'jenkins') {
            try {
              const repoIdentifier = project.repositoryUrl || project.id;
              this.logger.log(
                `Fetching Jenkins pipeline data for ${project.name} (${repoIdentifier})`,
              );

              const pipelineData =
                await this.jenkinsPipelineService.fetchAllPipelineData(
                  userId,
                  repoIdentifier,
                );

              // Debug: Log the structure of pipeline data
              this.logger.log(
                `Pipeline data for ${project.name}: ${JSON.stringify({
                  hasWorkflows: !!pipelineData?.workflows,
                  workflowCount: pipelineData?.workflows?.length || 0,
                  sampleWorkflow: pipelineData?.workflows?.[0]
                    ? {
                        name: pipelineData.workflows[0].name,
                        recentRunsCount:
                          pipelineData.workflows[0].recentRuns?.length || 0,
                      }
                    : null,
                })}`,
              );

              return {
                project,
                pipelineData,
              };
            } catch (error) {
              this.logger.error(
                `Failed to fetch Jenkins pipeline data for project ${project.name}: ${error.message}`,
              );
              return null;
            }
          }
          return null;
        }),
      ),
    );

    // Filter out failed fetches
    const validProjects = projectsWithPipelines.filter((p) => p !== null);

    this.logger.log(
      `Successfully fetched ${validProjects.length} project pipelines`,
    );

    // Calculate metrics from real pipeline data
    const totalProjects = organizations.reduce(
      (total, org) => total + (org.projects?.length || 0),
      0,
    );
    const activeAlerts = this.calculateActiveAlertsFromPipelines(validProjects); // Now counts failed runs
    const buildVolume = this.calculateBuildVolumeFromPipelines(validProjects);
    const pipelineHealthPercentage =
      this.calculatePipelineHealthFromPipelines(validProjects);
    const recentActivity = this.buildRecentActivityFromPipelines(validProjects);
    const reliabilityTrend =
      this.calculateReliabilityTrendFromPipelines(validProjects);
    const resourceConsumption =
      this.calculateResourceConsumptionFromPipelines(validProjects);

    // Generate AI-powered optimization suggestions
    const optimizationSuggestions = await this.generateOptimizationSuggestions(
      validProjects,
      pipelineHealthPercentage,
      activeAlerts,
      resourceConsumption,
      recentActivity,
    );

    return {
      totalProjects,
      activeAlerts,
      buildVolume,
      pipelineHealthPercentage,
      recentActivity,
      reliabilityTrend,
      optimizationSuggestions,
      resourceConsumption,
    };
  }

  private calculateActiveAlertsFromPipelines(projects: any[]): number {
    // Count failed pipeline runs instead of security alerts
    let failedRuns = 0;

    for (const { pipelineData } of projects) {
      for (const workflow of pipelineData.workflows || []) {
        for (const run of workflow.recentRuns || []) {
          if (
            run.conclusion === 'failure' ||
            run.status === 'failure' ||
            run.conclusion === 'cancelled' ||
            run.status === 'cancelled'
          ) {
            failedRuns++;
          }
        }
      }
    }

    this.logger.log(`Total failed/cancelled runs: ${failedRuns}`);
    return failedRuns;
  }

  private calculateBuildVolumeFromPipelines(projects: any[]): number {
    // Count total recent runs (same as pipeline health uses)
    let buildCount = 0;

    for (const { pipelineData } of projects) {
      for (const workflow of pipelineData.workflows || []) {
        buildCount += workflow.recentRuns?.length || 0;
      }
    }

    this.logger.log(`Total build volume: ${buildCount} runs`);
    return buildCount;
  }

  private calculatePipelineHealthFromPipelines(projects: any[]): number {
    let totalRuns = 0;
    let successfulRuns = 0;

    for (const { pipelineData } of projects) {
      for (const workflow of pipelineData.workflows || []) {
        for (const run of workflow.recentRuns || []) {
          totalRuns++;
          if (run.conclusion === 'success') {
            successfulRuns++;
          }
        }
      }
    }

    if (totalRuns === 0) return 0;
    return Math.round((successfulRuns / totalRuns) * 100);
  }

  private buildRecentActivityFromPipelines(
    projects: any[],
  ): RecentActivityItem[] {
    const activities: RecentActivityItem[] = [];

    this.logger.log(
      `Building recent activity from ${projects.length} projects`,
    );

    for (const { project, pipelineData } of projects) {
      for (const workflow of pipelineData.workflows || []) {
        for (const run of workflow.recentRuns || []) {
          if (!run.triggeredAt) continue;

          const runDate = new Date(run.triggeredAt);
          if (isNaN(runDate.getTime())) continue;

          activities.push({
            id: run.id?.toString() || '',
            type: 'pipeline',
            title: `${workflow.name} - ${run.conclusion || run.status}`,
            description: `${project.name} - ${run.head_branch || 'main'}`,
            status: run.conclusion || run.status,
            timestamp: runDate,
            projectName: project.name,
          });
        }
      }

      // Add security findings
      if (pipelineData.securityAnalysis?.issues) {
        for (const issue of pipelineData.securityAnalysis.issues) {
          activities.push({
            id: `security-${issue.line || Math.random()}`,
            type: 'security',
            title: issue.type || 'Security Finding',
            description: issue.description || 'Security issue detected',
            status: issue.severity,
            timestamp: new Date(),
            projectName: project.name,
            severity: issue.severity,
          });
        }
      }
    }

    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    this.logger.log(
      `Activity stream: ${activities.length} total activities, showing top 10`,
    );
    return sortedActivities;
  }

  private calculateReliabilityTrendFromPipelines(
    projects: any[],
  ): TrendDataPoint[] {
    const dailyStats = new Map<string, { success: number; total: number }>();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    this.logger.log(
      `Calculating reliability trend from ${ninetyDaysAgo.toISOString().split('T')[0]} to now`,
    );
    let processedRuns = 0;
    let filteredOutRuns = 0;

    for (const { pipelineData } of projects) {
      for (const workflow of pipelineData.workflows || []) {
        for (const run of workflow.recentRuns || []) {
          if (!run.triggeredAt) continue;

          const runDate = new Date(run.triggeredAt);
          if (isNaN(runDate.getTime())) continue;

          // Filter: only include runs from last 90 days
          if (runDate < ninetyDaysAgo) {
            filteredOutRuns++;
            continue;
          }

          processedRuns++;
          const dateKey = runDate.toISOString().split('T')[0];
          const stats = dailyStats.get(dateKey) || { success: 0, total: 0 };

          stats.total++;
          if (run.conclusion === 'success') {
            stats.success++;
          }

          dailyStats.set(dateKey, stats);
        }
      }
    }

    // Convert all daily stats to trend data (last 90 days)
    const trendData: TrendDataPoint[] = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        successRate:
          stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
        totalBuilds: stats.total,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dateRange =
      trendData.length > 0
        ? `from ${trendData[0].date} to ${trendData[trendData.length - 1].date}`
        : 'no data';

    this.logger.log(
      `Reliability trend: ${trendData.length} unique days with data (${processedRuns} runs processed, ${filteredOutRuns} filtered out). Range: ${dateRange}`,
    );
    return trendData;
  }

  private async generateOptimizationSuggestions(
    projects: any[],
    pipelineHealth: number,
    activeAlerts: number,
    resourceConsumption: ResourceConsumption,
    recentActivity: RecentActivityItem[],
  ): Promise<OptimizationSuggestion[]> {
    try {
      this.logger.log('Generating AI-powered optimization suggestions...');

      // Calculate total runs and collect statuses
      let totalRuns = 0;
      const activities: Array<{ status: string; conclusion?: string }> = [];

      for (const { pipelineData } of projects) {
        for (const workflow of pipelineData.workflows || []) {
          totalRuns += workflow.recentRuns?.length || 0;
          workflow.recentRuns?.forEach((run: any) => {
            activities.push({
              status: run.status,
              conclusion: run.conclusion,
            });
          });
        }
      }

      // Call Gemini AI for suggestions
      const suggestions =
        await this.geminiService.generateOptimizationSuggestions({
          pipelineHealth,
          failedRuns: activeAlerts,
          totalRuns,
          avgBuildDuration: resourceConsumption.averageBuildDuration,
          peakBuildTime: resourceConsumption.peakBuildTime,
          projectCount: projects.length,
          recentActivities: activities,
        });

      this.logger.log(
        `Generated ${suggestions.length} AI optimization suggestions`,
      );
      return suggestions as OptimizationSuggestion[];
    } catch (error) {
      this.logger.error(`Failed to generate AI suggestions: ${error.message}`);
      // Fallback to default suggestion
      return [
        {
          id: 'default',
          type: 'reliability' as const,
          title: 'System Running Smoothly',
          description:
            'Your pipelines are performing well! Consider implementing advanced monitoring and predictive analytics.',
          impact: 'low',
        },
      ];
    }
  }

  private calculateResourceConsumptionFromPipelines(
    projects: any[],
  ): ResourceConsumption {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    let totalDuration = 0;
    let runCount = 0;
    let maxDuration = 0;
    const projectDurations = new Map<
      string,
      { total: number; count: number }
    >();

    this.logger.log(
      `Calculating resource consumption for ${projects.length} projects`,
    );
    let totalRuns = 0;
    let runsWithoutCompletedAt = 0;
    let runsOutsideTimeRange = 0;

    for (const { project, pipelineData } of projects) {
      const projectName = project.name;
      let projectTotal = 0;
      let projectCount = 0;

      for (const workflow of pipelineData.workflows || []) {
        for (const run of workflow.recentRuns || []) {
          totalRuns++;

          if (!run.triggeredAt || !run.completedAt) {
            runsWithoutCompletedAt++;
            this.logger.warn(
              `Run ${run.id} missing dates: triggeredAt=${run.triggeredAt}, completedAt=${run.completedAt}`,
            );
            continue;
          }

          const runDate = new Date(run.triggeredAt);

          // Filter: only include runs from last 90 days
          if (runDate < ninetyDaysAgo) {
            runsOutsideTimeRange++;
            continue;
          }

          const duration =
            (new Date(run.completedAt).getTime() - runDate.getTime()) / 1000;

          this.logger.log(
            `Run ${run.id}: duration = ${Math.round(duration)}s (${Math.round(duration / 60)}m)`,
          );

          totalDuration += duration;
          runCount++;
          projectTotal += duration;
          projectCount++;

          if (duration > maxDuration) {
            maxDuration = duration;
          }
        }
      }

      if (projectCount > 0) {
        projectDurations.set(projectName, {
          total: projectTotal,
          count: projectCount,
        });
      }
    }

    const buildTimeByProject: BuildTimeByProject[] = Array.from(
      projectDurations.entries(),
    )
      .map(([projectName, stats]) => ({
        projectName,
        averageDuration: Math.round(stats.total / stats.count),
        totalBuilds: stats.count,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    const result = {
      averageBuildDuration:
        runCount > 0 ? Math.round(totalDuration / runCount) : 0,
      totalBuildTime: Math.round(totalDuration),
      peakBuildTime: Math.round(maxDuration),
      buildTimeByProject,
    };

    this.logger.log(
      `Resource consumption summary: ${totalRuns} total runs, ${runsWithoutCompletedAt} missing completedAt, ${runsOutsideTimeRange} outside 90-day range, ${runCount} processed successfully`,
    );
    this.logger.log(
      `Results: avg=${Math.round(result.averageBuildDuration / 60)}m, total=${Math.round(result.totalBuildTime / 3600)}h, peak=${Math.round(result.peakBuildTime / 60)}m, ${buildTimeByProject.length} projects`,
    );
    return result;
  }
}
