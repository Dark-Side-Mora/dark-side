import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { GithubAppController } from './github-app.controller';
import { GithubAppService } from './github-app.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [GithubController, GithubAppController],
  providers: [GithubService, GithubAppService, PrismaService],
  exports: [GithubService, GithubAppService],
})
export class IntegrationsModule {}
