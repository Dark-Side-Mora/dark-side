import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GithubPipelineService } from './github/github-pipeline.service';
import { JenkinsPipelineService } from './jenkins-pipeline.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('pipelines')
@UseGuards(JwtAuthGuard)
export class PipelinesController {
  constructor(
    private readonly githubPipelineService: GithubPipelineService,
    private readonly jenkinsPipelineService: JenkinsPipelineService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':provider/:repoIdentifier/data')
  async fetchAllPipelineData(
    @Req() req: any,
    @Param('provider') provider: string,
    @Param('repoIdentifier') repoIdentifier: string,
    @Query('limit') limit: string,
  ) {
    const userId = req.user?.id;
    const decodedRepo = decodeURIComponent(repoIdentifier);

    if (provider === 'jenkins') {
      return {
        statusCode: HttpStatus.OK,
        message: 'Jenkins pipeline data fetched successfully',
        data: await this.jenkinsPipelineService.fetchAllPipelineData(
          userId,
          decodedRepo,
        ),
      };
    }

    // Default to GitHub for backward compatibility or explicit github provider
    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub pipeline data fetched successfully',
      data: await this.githubPipelineService.fetchAllPipelineData(
        userId,
        decodedRepo,
      ),
    };
  }
}
