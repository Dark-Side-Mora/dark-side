import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './infrastructure/redis.service';
import { OpenSearchService } from './infrastructure/opensearch.service';
import { IntegrationsModule } from './integrations/integrations.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { LearningModule } from './learning/learning.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    IntegrationsModule,
    PipelinesModule,
    LearningModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RedisService, OpenSearchService],
})
export class AppModule {}
