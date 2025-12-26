import { Redis } from '@upstash/redis';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnections() {
  console.log('--- Testing Infrastructure Connections ---');

  // 1. Test Redis (Upstash HTTP)
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set('test_connection', 'ok', { ex: 30 });
    const val = await redis.get('test_connection');
    console.log(`✅ Redis: ${val === 'ok' ? 'Connected successfully' : 'Failed to retrieve value'}`);
  } catch (err) {
    console.error('❌ Redis Connection Failed:', err.message);
  }

  // 2. Test OpenSearch (Bonsai)
  try {
    const osClient = new Client({
      node: process.env.OPENSEARCH_NODE!,
    });
    const info = await osClient.info();
    console.log(`✅ OpenSearch: Connected to cluster "${info.body.cluster_name}" (Version: ${info.body.version.number})`);
  } catch (err) {
    console.error('❌ OpenSearch Connection Failed:', err.message);
  }
}

testConnections();
