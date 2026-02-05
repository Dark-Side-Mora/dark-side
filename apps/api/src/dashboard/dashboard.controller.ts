import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getDashboardMetrics(@Req() req: any): Promise<DashboardMetricsDto> {
    const userId = req.user.id;
    this.logger.log(`Getting dashboard metrics for user: ${userId}`);

    return this.dashboardService.getDashboardMetrics(userId);
  }
}
