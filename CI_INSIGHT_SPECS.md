# CI-Insight: Technical Specifications

This document outlines the database schema and API design for CI-Insight, as part of the project design submission.

---

## 📌 Database Schema (Prisma/PostgreSQL)

```prisma
// This is your Prisma schema file

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Organization {
  id        String    @id @default(cuid())
  name      String
  projects  Project[]
  users     User[]
  createdAt DateTime  @default(now())
}

model User {
  id             String       @id @default(cuid())
  email          String       @unique
  name           String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  projects       Project[]    @relation("ProjectEditors")
  createdAt      DateTime     @default(now())
}

model Project {
  id             String       @id @default(cuid())
  name           String
  description    String?
  provider       CIProvider   // GITHUB, GITLAB, JENKINS
  repoUrl        String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  pipelines      Pipeline[]
  editors        User[]       @relation("ProjectEditors")
  configPath     String?      // e.g., .github/workflows/main.yml
  createdAt      DateTime     @default(now())
}

model Pipeline {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  externalId  String   // ID from GitHub/GitLab
  status      String   // success, failure, running, pending
  branch      String
  commitSha   String
  triggeredBy String?
  duration    Int?     // in seconds
  jobs        Job[]
  logs        Log[]
  securityScan SecurityScan?
  startedAt   DateTime @default(now())
  completedAt DateTime?
}

model Job {
  id          String   @id @default(cuid())
  pipelineId  String
  pipeline    Pipeline @relation(fields: [pipelineId], references: [id])
  name        String
  status      String
  dependencies String[] // Array of job names this job depends on
  duration    Int?
  startedAt   DateTime @default(now())
  completedAt DateTime?
}

model Log {
  id         String   @id @default(cuid())
  pipelineId String
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  content    String   // Store in OpenSearch/ElasticSearch for large logs, but metadata here
  level      LogLevel @default(INFO)
  timestamp  DateTime @default(now())
}

model SecurityScan {
  id         String   @id @default(cuid())
  pipelineId String   @unique
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  score      Int      // 0-100
  findings   Finding[]
  createdAt  DateTime @default(now())
}

model Finding {
  id             String   @id @default(cuid())
  securityScanId String
  securityScan   SecurityScan @relation(fields: [securityScanId], references: [id])
  severity       Severity // CRITICAL, HIGH, MEDIUM, LOW
  title          String
  description    String
  remediation    String
  file           String?
  line           Int?
}

enum CIProvider {
  GITHUB
  GITLAB
  JENKINS
}

enum LogLevel {
  INFO
  WARN
  ERROR
  DEBUG
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}
```

---

## 📌 API Design (RESTful)

### Projects
- `GET /api/projects`: List all projects in the organization.
- `POST /api/projects`: Connect a new CI provider repository.
- `GET /api/projects/:id`: Get project details and connection status.

### Pipelines
- `GET /api/pipelines`: Search and filter pipelines across projects.
- `GET /api/projects/:id/pipelines`: List pipelines for a specific project.
- `GET /api/pipelines/:id`: Get detailed pipeline data (Visualizer graph data).

### Logs
- `GET /api/pipelines/:id/logs`: Stream or fetch normalized logs.
- `GET /api/logs/search?q=...`: Search log contents across all pipelines (OpenSearch backend).

### Security
- `GET /api/security/trends`: Get organization-wide security scoring trends.
- `GET /api/pipelines/:id/security`: Detailed security scan findings for a run.
- `POST /api/security/scan/:projectId`: Manual trigger of config scanning.

### Analytics
- `GET /api/analytics/metrics`: Fetch performance metrics (MTTR, Success Rate).
- `GET /api/analytics/usage`: CI/CD resource usage and cost analysis.

---

## 📌 Next Steps: Roadmap

1. **Phase 1 (MVP)**:
   - Connect GitHub OAuth.
   - Parse `.github/workflows` to generate the Visualization graph (D3.js).
   - Basic Log ingestion from GitHub Actions API.
2. **Phase 2 (Security & Intelligence)**:
   - Implement YAML security rule engine (Rego/Custom).
   - Add trend charts using Tremor/Recharts.
3. **Phase 3 (AI)**:
   - Integrate OpenAI for log error explanation and remediation suggestions.
