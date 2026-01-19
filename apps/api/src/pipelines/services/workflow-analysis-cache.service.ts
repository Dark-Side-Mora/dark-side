import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { SecurityAnalysisResult } from '../../ai/interfaces/ai-provider.interface';

export interface CacheCheckResult {
  isCached: boolean;
  analysis?: any;
}

@Injectable()
export class WorkflowAnalysisCacheService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate hash from workflow content and logs
   * Used to identify if the same data has been analyzed before
   */
  private generateContentHash(
    workflowContent: string,
    latestLogs: string,
  ): string {
    const combined = `${workflowContent}:${latestLogs}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Check if analysis already exists in cache
   * Returns cached analysis if found and not expired
   */
  async getAnalysisFromCache(
    userId: string,
    repositoryId: string,
    workflowContent: string,
    latestLogs: string,
  ): Promise<CacheCheckResult> {
    try {
      const contentHash = this.generateContentHash(workflowContent, latestLogs);

      const cachedAnalysis =
        (await this.prisma.workflowAnalysisCache.findUnique({
          where: {
            repositoryId_contentHash: {
              repositoryId,
              contentHash,
            },
          },
        })) as any;

      if (!cachedAnalysis) {
        return { isCached: false };
      }

      // Check if cache has expired
      if (new Date() > cachedAnalysis.expiresAt) {
        // Delete expired cache
        await this.prisma.workflowAnalysisCache.delete({
          where: { id: cachedAnalysis.id },
        });
        return { isCached: false };
      }

      // Return cached analysis
      return {
        isCached: true,
        analysis: {
          analysisId: cachedAnalysis.analysisId,
          timestamp: cachedAnalysis.analysisTimestamp.toISOString(),
          overallRisk: cachedAnalysis.overallRisk,
          summary: cachedAnalysis.summary,
          issues: cachedAnalysis.issues,
          cached: true,
          cacheHitAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error checking cache:', error);
      return { isCached: false };
    }
  }

  /**
   * Save analysis result to cache
   */
  async saveAnalysisToCache(
    userId: string,
    repositoryId: string,
    workflowPath: string,
    workflowName: string,
    workflowContent: string,
    latestLogs: string,
    analysis: SecurityAnalysisResult,
    aiProvider: string = 'gemini',
  ): Promise<void> {
    try {
      const contentHash = this.generateContentHash(workflowContent, latestLogs);

      // Cache for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      (await this.prisma.workflowAnalysisCache.upsert({
        where: {
          repositoryId_contentHash: {
            repositoryId,
            contentHash,
          },
        },
        update: {
          userId,
          workflowFileContent: workflowContent,
          latestRunLogs: latestLogs,
          overallRisk: analysis.overallRisk,
          summary: analysis.summary,
          issues: analysis.issues as any,
          analysisTimestamp: new Date(analysis.timestamp),
          expiresAt,
          updatedAt: new Date(),
        },
        create: {
          userId,
          repositoryId,
          workflowPath,
          workflowName,
          workflowFileContent: workflowContent,
          latestRunLogs: latestLogs,
          contentHash,
          analysisId: analysis.analysisId,
          aiProvider,
          overallRisk: analysis.overallRisk,
          summary: analysis.summary,
          issues: analysis.issues as any,
          analysisTimestamp: new Date(analysis.timestamp),
          expiresAt,
        },
      })) as any;
    } catch (error) {
      console.error('Error saving analysis to cache:', error);
      // Don't throw - caching failure should not break the flow
    }
  }

  /**
   * Clear expired cache entries (can be run as a scheduled job)
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const result = await this.prisma.workflowAnalysisCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      return result.count;
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Clear cache for specific workflow
   */
  async clearWorkflowCache(
    repositoryId: string,
    workflowPath: string,
  ): Promise<void> {
    try {
      await this.prisma.workflowAnalysisCache.deleteMany({
        where: {
          repositoryId,
          workflowPath,
        },
      });
    } catch (error) {
      console.error('Error clearing workflow cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(userId?: string): Promise<{
    totalCached: number;
    activeCached: number;
    expiredCount: number;
  }> {
    try {
      const where = userId ? { userId } : {};

      const [totalCached, activeCached, expiredCount] = await Promise.all([
        this.prisma.workflowAnalysisCache.count({ where }),
        this.prisma.workflowAnalysisCache.count({
          where: {
            ...where,
            expiresAt: { gt: new Date() },
          },
        }),
        this.prisma.workflowAnalysisCache.count({
          where: {
            ...where,
            expiresAt: { lte: new Date() },
          },
        }),
      ]);

      return { totalCached, activeCached, expiredCount };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalCached: 0, activeCached: 0, expiredCount: 0 };
    }
  }
}
