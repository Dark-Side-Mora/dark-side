import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubPipelineController } from './github/github-pipeline.controller';
import { GithubPipelineService } from './github/github-pipeline.service';
import { PipelineAnalysisService } from './services/pipeline-analysis.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AIModule } from '../ai/ai.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    HttpModule,
    IntegrationsModule, // Import to use GithubAppService
    AIModule, // Import AI services for security analysis
  ],
  controllers: [GithubPipelineController],
  providers: [GithubPipelineService, PipelineAnalysisService, PrismaService],
  exports: [GithubPipelineService, PipelineAnalysisService],
})
export class PipelinesModule {}
