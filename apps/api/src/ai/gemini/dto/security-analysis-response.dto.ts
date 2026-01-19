export class SecurityIssueDto {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  suggestedFix?: string;
  category: string;
}

export class SecurityAnalysisResponseDto {
  analysisId: string;
  timestamp: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
  issues: SecurityIssueDto[];
}
