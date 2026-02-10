import {
  Controller,
  Get,
  Param,
  BadRequestException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JenkinsPipelineService } from '../jenkins-pipeline.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('pipelines/jenkins')
@UseGuards(JwtAuthGuard)
export class JenkinsPipelineController {
  constructor(
    private readonly jenkinsPipelineService: JenkinsPipelineService,
  ) {}

  /**
   * GET /pipelines/jenkins/:projectName/runs/:runId/graph
   * Fetch workflow graph for Jenkins pipeline visualization
   *
   * @param projectName - Jenkins project/job name
   * @param runId - Pipeline run ID (UUID from database)
   */
  @Get(':projectName/runs/:runId/graph')
  async fetchWorkflowGraph(
    @Req() req: any,
    @Param('projectName') projectName: string,
    @Param('runId') runId: string,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const decodedProjectName = decodeURIComponent(projectName);

      const graphData = await this.jenkinsPipelineService.fetchWorkflowGraph(
        userId,
        decodedProjectName,
        runId,
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
   * GET /pipelines/jenkins/health
   * Health check endpoint for Jenkins pipeline service
   */
  @Get('health')
  healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Jenkins pipeline service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
