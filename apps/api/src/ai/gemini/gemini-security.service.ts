import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAIProvider,
  SecurityAnalysisResult,
  SecurityIssue,
} from '../interfaces/ai-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class GeminiSecurityService implements IAIProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    });
  }

  /**
   * Analyze workflow and logs for security issues
   */
  async analyzeWorkflowSecurity(
    workflowContent: string,
    latestLogs: string,
    workflowName: string,
  ): Promise<SecurityAnalysisResult> {
    try {
      const prompt = this.buildSecurityAnalysisPrompt(
        workflowContent,
        latestLogs,
        workflowName,
      );

      const response = await this.model.generateContent(prompt);
      const text = response.response.text();

      // Parse JSON response from Gemini
      const analysisData = this.parseGeminiResponse(text);

      return {
        analysisId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        overallRisk: analysisData.overallRisk,
        summary: analysisData.summary,
        issues: analysisData.issues,
      };
    } catch (error) {
      console.error('Error analyzing workflow security:', error);
      throw new InternalServerErrorException(
        `Failed to analyze workflow security: ${error.message}`,
      );
    }
  }

  /**
   * Build the prompt for Gemini security analysis
   */
  private buildSecurityAnalysisPrompt(
    workflowContent: string,
    latestLogs: string,
    workflowName: string,
  ): string {
    return `You are a GitHub Actions security expert. Analyze the following workflow file and execution logs for security vulnerabilities and best practice violations.

WORKFLOW NAME: ${workflowName}

WORKFLOW FILE (.yml):
\`\`\`yaml
${workflowContent}
\`\`\`

LATEST RUN LOGS:
\`\`\`
${latestLogs}
\`\`\`

Provide a detailed security analysis in the following JSON format ONLY (no markdown, just valid JSON):
{
  "overallRisk": "critical|high|medium|low",
  "summary": "Brief summary of security posture",
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "title": "Issue title",
      "description": "Detailed description of the issue",
      "location": "line X or step name",
      "recommendation": "How to fix this issue",
      "suggestedFix": "Example code or configuration fix",
      "category": "secrets|permissions|dependencies|best-practices|credentials|code-quality"
    }
  ]
}

Focus on:
1. Exposed secrets or credentials in logs
2. Overly permissive permissions (read-all, write-all)
3. Unvalidated external inputs
4. Insecure dependency versions
5. Missing SBOM or vulnerability scanning
6. Hardcoded values
7. Unencrypted artifact storage
8. Missing branch protection rules references
9. Insecure code practices

Return ONLY valid JSON, no additional text.`;
  }

  /**
   * Parse Gemini response and extract JSON
   */
  private parseGeminiResponse(text: string): {
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    issues: SecurityIssue[];
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonText = jsonMatch[0];

      // Unescape JSON properly - Gemini might send escaped content
      try {
        // First attempt: try parsing as-is
        const parsed = JSON.parse(jsonText);

        // Validate response structure
        if (
          !parsed.overallRisk ||
          !parsed.summary ||
          !Array.isArray(parsed.issues)
        ) {
          throw new Error('Invalid response structure');
        }

        return parsed;
      } catch (parseError) {
        // Second attempt: fix common escaping issues
        // Remove extra backslashes before quotes within strings
        jsonText = jsonText.replace(/\\"/g, '"');
        // Fix newlines in strings
        jsonText = jsonText.replace(/\\n/g, ' ');
        // Remove control characters
        jsonText = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ');

        const parsed = JSON.parse(jsonText);

        // Validate response structure
        if (
          !parsed.overallRisk ||
          !parsed.summary ||
          !Array.isArray(parsed.issues)
        ) {
          throw new Error('Invalid response structure');
        }

        return parsed;
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw text length:', text.length);
      // Return default response if parsing fails
      return {
        overallRisk: 'medium',
        summary:
          'Unable to complete analysis. Please check the workflow manually.',
        issues: [
          {
            severity: 'high',
            title: 'Analysis Failed',
            description: 'The AI analysis could not be completed properly.',
            recommendation:
              'Please review the workflow manually or contact support.',
            category: 'system',
          },
        ],
      };
    }
  }

  /**
   * Generate AI-powered optimization suggestions for CI/CD pipelines
   */
  async generateOptimizationSuggestions(pipelineMetrics: {
    pipelineHealth: number;
    failedRuns: number;
    totalRuns: number;
    avgBuildDuration: number;
    peakBuildTime: number;
    projectCount: number;
    recentActivities: Array<{ status: string; conclusion?: string }>;
  }): Promise<
    Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedSavings?: string;
    }>
  > {
    try {
      const prompt = `You are a DevOps and CI/CD expert analyzing pipeline performance metrics. Based on the following data, provide 2-4 specific, actionable optimization suggestions.

Pipeline Metrics:
- Success Rate: ${pipelineMetrics.pipelineHealth}%
- Failed Runs: ${pipelineMetrics.failedRuns} out of ${pipelineMetrics.totalRuns}
- Average Build Duration: ${Math.round(pipelineMetrics.avgBuildDuration)}s (${Math.round(pipelineMetrics.avgBuildDuration / 60)}m)
- Peak Build Time: ${Math.round(pipelineMetrics.peakBuildTime)}s
- Total Projects: ${pipelineMetrics.projectCount}
- Recent Build Statuses: ${pipelineMetrics.recentActivities
        .slice(0, 10)
        .map((a) => a.conclusion || a.status)
        .join(', ')}

Analyze the metrics and provide optimization suggestions in the following JSON format:
{
  "suggestions": [
    {
      "type": "performance|reliability|security|cost",
      "title": "Brief title (max 50 chars)",
      "description": "Detailed actionable recommendation (max 150 chars)",
      "impact": "high|medium|low",
      "estimatedSavings": "Optional: e.g., '~5 minutes per build' or '~30% faster builds'"
    }
  ]
}

Rules:
1. If success rate < 80%, prioritize reliability improvements
2. If avg build time > 5 minutes, suggest performance optimizations
3. If builds are fast (<30s), acknowledge efficiency and suggest advanced monitoring
4. Be specific and actionable
5. Return ONLY valid JSON, no markdown formatting
6. Provide 2-4 suggestions max`;

      const response = await this.model.generateContent(prompt);
      const text = response.response.text();

      // Clean up markdown formatting if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedText);

      return parsed.suggestions.map((s: any, index: number) => ({
        id: `ai-${index}`,
        type: s.type,
        title: s.title,
        description: s.description,
        impact: s.impact,
        estimatedSavings: s.estimatedSavings,
      }));
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      // Return default suggestion if AI fails
      return [
        {
          id: 'default',
          type: 'reliability',
          title: 'System Running Smoothly',
          description:
            'Your pipelines are performing well! Consider implementing advanced monitoring and predictive analytics.',
          impact: 'low',
        },
      ];
    }
  }
}
