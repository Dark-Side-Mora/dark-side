import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeWorkflowSecurityDto {
  @IsString()
  @IsNotEmpty()
  workflowContent: string;

  @IsString()
  @IsNotEmpty()
  latestLogs: string;

  @IsString()
  @IsNotEmpty()
  workflowName: string;
}
