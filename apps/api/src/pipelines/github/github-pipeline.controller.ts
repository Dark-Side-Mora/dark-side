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
import { GithubPipelineService } from './github-pipeline.service';
import { PipelineAnalysisService } from '../services/pipeline-analysis.service';
import {
  FetchPipelinesDto,
  FetchPipelinesParamsDto,
} from './dto/fetch-pipelines.dto';
import { PipelineResponseDto } from './dto/pipeline-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('pipelines/github')
@UseGuards(JwtAuthGuard)
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
    @Req() req: any,
    @Param('repoIdentifier') repoIdentifier: string,
    @Query() query: FetchPipelinesDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: PipelineResponseDto;
  }> {
    try {
      const { limit } = query;
      const userId = req.user?.id;

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
   * GET /pipelines/github/:repoIdentifier/runs/:runId/graph
   * Fetch workflow graph with job dependencies and execution details for visualization
   *
   * @param repoIdentifier - Repository in format "owner/repo"
   * @param runId - Workflow run ID
   * @param userId - User ID to authenticate with GitHub
   */
  @Get(':repoIdentifier/runs/:runId/graph')
  async fetchWorkflowGraph(
    @Req() req: any,
    @Param('repoIdentifier') repoIdentifier: string,
    @Param('runId') runId: string,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const decodedRepoIdentifier = decodeURIComponent(repoIdentifier);
      const runIdNum = parseInt(runId, 10);

      if (isNaN(runIdNum)) {
        throw new BadRequestException('Invalid runId format');
      }

      const graphData = await this.githubPipelineService.fetchWorkflowGraph(
        userId,
        decodedRepoIdentifier,
        runIdNum,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Workflow graph fetched successfully',
        graph: graphData,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch workflow graph: ${error.message}`,
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
    @Req() req: any,
    @Param('repoIdentifier') repoIdentifier: string,
  ) {
    try {
      const userId = req.user?.id;
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
    @Req() req: any,
    @Param('repoIdentifier') repoIdentifier: string,
  ) {
    try {
      const userId = req.user?.id;
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
