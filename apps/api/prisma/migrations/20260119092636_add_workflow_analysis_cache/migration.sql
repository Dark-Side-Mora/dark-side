-- CreateTable
CREATE TABLE "WorkflowAnalysisCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "workflowPath" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "workflowFileContent" TEXT NOT NULL,
    "latestRunLogs" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "overallRisk" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "analysisTimestamp" TIMESTAMP(3) NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowAnalysisCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAnalysisCache_analysisId_key" ON "WorkflowAnalysisCache"("analysisId");

-- CreateIndex
CREATE INDEX "WorkflowAnalysisCache_userId_idx" ON "WorkflowAnalysisCache"("userId");

-- CreateIndex
CREATE INDEX "WorkflowAnalysisCache_repositoryId_idx" ON "WorkflowAnalysisCache"("repositoryId");

-- CreateIndex
CREATE INDEX "WorkflowAnalysisCache_workflowPath_idx" ON "WorkflowAnalysisCache"("workflowPath");

-- CreateIndex
CREATE INDEX "WorkflowAnalysisCache_expiresAt_idx" ON "WorkflowAnalysisCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowAnalysisCache_repositoryId_contentHash_key" ON "WorkflowAnalysisCache"("repositoryId", "contentHash");

-- AddForeignKey
ALTER TABLE "WorkflowAnalysisCache" ADD CONSTRAINT "WorkflowAnalysisCache_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
