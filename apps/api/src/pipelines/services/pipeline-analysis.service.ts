import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GeminiSecurityService } from '../../ai/gemini/gemini-security.service';
import { WorkflowAnalysisCacheService } from './workflow-analysis-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PipelineData,
  Workflow,
  WorkflowRun,
} from '../interfaces/pipeline-provider.interface';

export interface WorkflowAnalysisRequest {
  userId: string;
  repoIdentifier: string;
  workflowId: number | string;
}

export interface WorkflowAnalysisResponse {
  pipelineData: PipelineData;
  securityAnalysis: {
    analysisId: string;
    timestamp: string;
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    issues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      description: string;
      location?: string;
      recommendation: string;
      suggestedFix?: string;
      category: string;
    }>;
    cached?: boolean;
    cacheHitAt?: string;
  };
}

@Injectable()
export class PipelineAnalysisService {
  constructor(
    private readonly geminiSecurityService: GeminiSecurityService,
    private readonly cacheService: WorkflowAnalysisCacheService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyze workflow with security recommendations
   */
  async analyzeWorkflowWithSecurity(
    pipelineData: PipelineData,
    userId: string,
  ): Promise<WorkflowAnalysisResponse> {
    try {
      // Find the first workflow with recent runs
      const workflowWithRuns = pipelineData.workflows.find(
        (wf) => wf.recentRuns && wf.recentRuns.length > 0,
      );

      if (!workflowWithRuns) {
        throw new NotFoundException(
          'No workflows with recent runs found for analysis',
        );
      }

      // Get the latest run
      const latestRun = workflowWithRuns.recentRuns[0];

      // Prepare data for security analysis
      const workflowContent = workflowWithRuns.content || '';
      const latestLogs = this.aggregateLogsFromRun(latestRun);

      if (!workflowContent) {
        throw new InternalServerErrorException(
          'Workflow content not available for analysis',
        );
      }

      // Get repository ID for caching
      const repositoryId = pipelineData.repository.id.toString();

      // Check cache first
      const cacheResult = await this.cacheService.getAnalysisFromCache(
        userId,
        repositoryId,
        workflowContent,
        latestLogs,
      );

      if (cacheResult.isCached && cacheResult.analysis) {
        console.log(
          'Returning cached analysis for workflow:',
          workflowWithRuns.name,
        );
        return {
          pipelineData,
          securityAnalysis: {
            ...cacheResult.analysis,
            cached: true,
            cacheHitAt: cacheResult.analysis.timestamp,
          },
        };
      }

      // Call Gemini for security analysis
      const securityAnalysis =
        await this.geminiSecurityService.analyzeWorkflowSecurity(
          workflowContent,
          latestLogs,
          workflowWithRuns.name,
        );

      // Save to cache for future use
      await this.cacheService.saveAnalysisToCache(
        userId,
        repositoryId,
        workflowWithRuns.path,
        workflowWithRuns.name,
        workflowContent,
        latestLogs,
        securityAnalysis,
        'gemini',
      );

      return {
        pipelineData,
        securityAnalysis,
      };
    } catch (error) {
      console.error('Error analyzing workflow:', error);
      throw error;
    }
  }

  /**
   * Aggregate logs from a workflow run's jobs
   */
  private aggregateLogsFromRun(run: WorkflowRun): string {
    if (!run.jobs || run.jobs.length === 0) {
      return '';
    }

    const logs = run.jobs
      .filter((job) => job.logs)
      .map((job) => `\n=== Job: ${job.name} ===\n${job.logs}`)
      .join('\n');

    return logs || 'No logs available for analysis';
  }
}
