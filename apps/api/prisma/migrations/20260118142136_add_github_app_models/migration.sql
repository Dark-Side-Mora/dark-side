-- CreateTable
CREATE TABLE "GitHubInstallation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "installationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "repositorySelection" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "permissions" JSONB,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubInstallation_installationId_key" ON "GitHubInstallation"("installationId");

-- CreateIndex
CREATE INDEX "GitHubInstallation_userId_idx" ON "GitHubInstallation"("userId");

-- CreateIndex
CREATE INDEX "GitHubInstallation_installationId_idx" ON "GitHubInstallation"("installationId");

-- CreateIndex
CREATE INDEX "GitHubInstallation_accountId_idx" ON "GitHubInstallation"("accountId");

-- CreateIndex
CREATE INDEX "GitHubRepository_installationId_idx" ON "GitHubRepository"("installationId");

-- CreateIndex
CREATE INDEX "GitHubRepository_repositoryId_idx" ON "GitHubRepository"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepository_installationId_repositoryId_key" ON "GitHubRepository"("installationId", "repositoryId");

-- AddForeignKey
ALTER TABLE "GitHubInstallation" ADD CONSTRAINT "GitHubInstallation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GitHubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
