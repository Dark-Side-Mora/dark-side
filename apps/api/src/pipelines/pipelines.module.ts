import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubPipelineController } from './github/github-pipeline.controller';
import { GithubPipelineService } from './github/github-pipeline.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    HttpModule,
    IntegrationsModule, // Import to use GithubAppService
  ],
  controllers: [GithubPipelineController],
  providers: [GithubPipelineService, PrismaService],
  exports: [GithubPipelineService],
})
export class PipelinesModule {}
