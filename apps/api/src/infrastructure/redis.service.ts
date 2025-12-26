import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async setStatus(runId: string, status: string) {
    await this.client.set(`pipeline:run:${runId}:status`, status, { ex: 15 });
  }

  async setProgress(jobId: string, progress: number) {
    await this.client.set(`pipeline:job:${jobId}:progress`, progress, { ex: 15 });
  }

  async setDashboardCache(projectId: string, data: any) {
    await this.client.set(`dashboard:project:${projectId}`, JSON.stringify(data), { ex: 120 });
  }

  async getStatus(runId: string) {
    return await this.client.get(`pipeline:run:${runId}:status`);
  }
}
