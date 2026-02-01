import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from './redis.service';
import { OpenSearchService } from './opensearch.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, OpenSearchService],
  exports: [PrismaService, RedisService, OpenSearchService],
})
export class InfrastructureModule {}
