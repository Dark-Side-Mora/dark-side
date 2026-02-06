import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { PipelinesModule } from '../pipelines/pipelines.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [PipelinesModule, AIModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
  exports: [DashboardService],
})
export class DashboardModule {}
