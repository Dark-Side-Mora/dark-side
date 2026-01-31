import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubAppController } from './github-app.controller';
import { GithubAppService } from './github-app.service';
import { JenkinsController } from './jenkins.controller';
import { JenkinsService } from './jenkins.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [GithubController, GithubAppController, JenkinsController],
  providers: [GithubService, GithubAppService, JenkinsService],
  exports: [GithubService, GithubAppService, JenkinsService],
})
export class IntegrationsModule {}
