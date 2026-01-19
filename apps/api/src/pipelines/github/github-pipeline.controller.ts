import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { GithubPipelineService } from './github-pipeline.service';
import { PipelineAnalysisService } from '../services/pipeline-analysis.service';
import {
  FetchPipelinesDto,
  FetchPipelinesParamsDto,
} from './dto/fetch-pipelines.dto';
import { PipelineResponseDto } from './dto/pipeline-response.dto';

@Controller('pipelines/github')
export class GithubPipelineController {
  constructor(
    private readonly githubPipelineService: GithubPipelineService,
    private readonly pipelineAnalysisService: PipelineAnalysisService,
  ) {}

  /**
   * GET /pipelines/github/:repoIdentifier/data
   * Fetch all pipeline data for a GitHub repository
   *
   * @param repoIdentifier - Repository in format "owner/repo"
   * @param userId - User ID to authenticate with GitHub
   * @param limit - Number of recent runs per workflow (default: 10)
   *
   * @example
   * GET /pipelines/github/microsoft/vscode/data?userId=user123&limit=5
   */
  @Get(':repoIdentifier/data')
  async fetchAllPipelineData(
    @Param('repoIdentifier') repoIdentifier: string,
    @Query() query: FetchPipelinesDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: PipelineResponseDto;
  }> {
    try {
      const { userId, limit } = query;

      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      // Decode repository identifier if it's URL encoded
      const decodedRepoIdentifier = decodeURIComponent(repoIdentifier);

      const pipelineData =
        await this.githubPipelineService.fetchAllPipelineData(
          userId,
          decodedRepoIdentifier,
        );

      return {
        statusCode: HttpStatus.OK,
        message: 'Pipeline data fetched successfully',
        data: pipelineData,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error.status === HttpStatus.NOT_FOUND ||
        error.status === HttpStatus.UNAUTHORIZED
      ) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to fetch pipeline data: ${error.message}`,
      );
    }
  }

  /**
   * GET /pipelines/github/:repoIdentifier/workflows
   * Fetch only workflows (without runs) for a repository
   *
   * @param repoIdentifier - Repository in format "owner/repo"
   * @param userId - User ID to authenticate with GitHub
   */
  @Get(':repoIdentifier/workflows')
  async fetchWorkflows(
    @Param('repoIdentifier') repoIdentifier: string,
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const decodedRepoIdentifier = decodeURIComponent(repoIdentifier);
      const workflows = await this.githubPipelineService.fetchWorkflows(
        decodedRepoIdentifier,
        userId,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Workflows fetched successfully',
        data: { workflows },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch workflows: ${error.message}`,
      );
    }
  }

  /**
   * GET /pipelines/github/:repoIdentifier/analyze
   * INTERNAL ENDPOINT: Fetch pipeline data and perform AI security analysis
   * Returns pipeline data + security analysis from Gemini
   *
   * @param repoIdentifier - Repository in format "owner/repo"
   * @param userId - User ID to authenticate with GitHub
   */
  @Get(':repoIdentifier/analyze')
  async analyzePipelineSecurity(
    @Param('repoIdentifier') repoIdentifier: string,
    @Query('userId') userId: string,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const decodedRepoIdentifier = decodeURIComponent(repoIdentifier);

      // Fetch pipeline data
      const pipelineData =
        await this.githubPipelineService.fetchAllPipelineData(
          userId,
          decodedRepoIdentifier,
        );

      // Perform security analysis
      const analysisResponse =
        await this.pipelineAnalysisService.analyzeWorkflowWithSecurity(
          pipelineData,
          userId,
        );

      return {
        statusCode: HttpStatus.OK,
        message: 'Pipeline analyzed successfully',
        data: analysisResponse,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to analyze pipeline: ${error.message}`,
      );
    }
  }

  /**
   * GET /pipelines/github/health
   * Health check endpoint for GitHub pipeline service
   */
  @Get('health')
  healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub pipeline service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
