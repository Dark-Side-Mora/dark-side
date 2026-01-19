import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GeminiSecurityService } from '../../ai/gemini/gemini-security.service';
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
  };
}

@Injectable()
export class PipelineAnalysisService {
  constructor(private readonly geminiSecurityService: GeminiSecurityService) {}

  /**
   * Analyze workflow with security recommendations
   */
  async analyzeWorkflowWithSecurity(
    pipelineData: PipelineData,
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

      // Call Gemini for security analysis
      const securityAnalysis =
        await this.geminiSecurityService.analyzeWorkflowSecurity(
          workflowContent,
          latestLogs,
          workflowWithRuns.name,
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
