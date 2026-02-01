import { Injectable } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpenSearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_NODE,
    });
  }

  async indexLog(projectId: string, log: any) {
    return await this.client.index({
      index: `pipeline-logs-${projectId}`,
      body: {
        ...log,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async searchLogs(projectId: string, jobId: string) {
    return await this.client.search({
      index: `pipeline-logs-${projectId}`,
      body: {
        query: {
          bool: {
            must: [{ match: { jobId: jobId } }],
          },
        },
        size: 1,
      },
    });
  }
}
