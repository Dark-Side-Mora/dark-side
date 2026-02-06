import { Controller, Get, Logger, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getDashboardMetrics(
    @Req() req: any,
    @Query('refresh') refresh?: string,
  ): Promise<DashboardMetricsDto> {
    const userId = req.user.id;
    const isRefresh = refresh === 'true';

    if (isRefresh) {
      this.logger.log(`Manual refresh requested for user: ${userId}`);
      return this.dashboardService.fetchFreshMetrics(userId);
    }

    this.logger.log(`Getting dashboard metrics for user: ${userId}`);
    return this.dashboardService.getDashboardMetrics(userId);
  }
}
