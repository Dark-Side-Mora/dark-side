/**
 * Base interface for all AI analysis providers
 * Implement this interface for Gemini, OpenAI, Claude, etc.
 */
export interface IAIProvider {
  /**
   * Perform security analysis on workflow and logs
   */
  analyzeWorkflowSecurity(
    workflowContent: string,
    latestLogs: string,
    workflowName: string,
  ): Promise<SecurityAnalysisResult>;
}

export interface SecurityAnalysisResult {
  analysisId: string;
  timestamp: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  issues: SecurityIssue[];
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location?: string; // e.g., "line 10" or "step name"
  recommendation: string;
  suggestedFix?: string; // Code snippet
  category: string; // e.g., "secrets", "permissions", "dependencies", "best-practices"
}
