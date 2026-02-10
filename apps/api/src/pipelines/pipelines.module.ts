import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubPipelineController } from './github/github-pipeline.controller';
import { GithubPipelineService } from './github/github-pipeline.service';
import { JenkinsPipelineController } from './jenkins/jenkins-pipeline.controller';
import { JenkinsPipelineService } from './jenkins-pipeline.service';
import { PipelinesController } from './pipelines.controller';
import { PipelineAnalysisService } from './services/pipeline-analysis.service';
import { WorkflowAnalysisCacheService } from './services/workflow-analysis-cache.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    HttpModule,
    IntegrationsModule, // Import to use GithubAppService
    AIModule, // Import AI services for security analysis
  ],
  controllers: [
    GithubPipelineController,
    JenkinsPipelineController,
    PipelinesController,
  ],
  providers: [
    GithubPipelineService,
    JenkinsPipelineService,
    PipelineAnalysisService,
    WorkflowAnalysisCacheService,
  ],
  exports: [
    GithubPipelineService,
    JenkinsPipelineService,
    PipelineAnalysisService,
    WorkflowAnalysisCacheService,
  ],
})
export class PipelinesModule {}
