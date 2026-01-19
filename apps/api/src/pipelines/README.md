# Pipelines Module

This module provides endpoints to fetch CI/CD pipeline data from various providers (GitHub, Jenkins, GitLab, etc.).

## Architecture

The pipelines module follows an extensible provider pattern:

```
pipelines/
├── interfaces/
│   └── pipeline-provider.interface.ts  # Base interface for all providers
├── github/
│   ├── github-pipeline.service.ts      # GitHub implementation
│   ├── github-pipeline.controller.ts   # GitHub endpoints
│   └── dto/                            # Request/Response DTOs
├── jenkins/                            # Future: Jenkins implementation
└── gitlab/                             # Future: GitLab implementation
```

## GitHub Pipeline Endpoints

### 1. Fetch All Pipeline Data

**Endpoint:** `GET /pipelines/github/:repoIdentifier/data`

Fetches complete pipeline data including workflows, runs, jobs, and optionally logs.

**Parameters:**

- `repoIdentifier` (path): Repository in format `owner/repo` (e.g., `microsoft/vscode`)
- `userId` (query): User ID to authenticate with GitHub App
- `limit` (query, optional): Number of recent runs per workflow (default: 10)

**Example Request:**

```bash
GET /pipelines/github/microsoft%2Fvscode/data?userId=user123&limit=5
```

**Example Response:**

```json
{
  "statusCode": 200,
  "message": "Pipeline data fetched successfully",
  "data": {
    "repository": {
      "id": 41881900,
      "name": "vscode",
      "fullName": "microsoft/vscode",
      "provider": "github"
    },
    "workflows": [
      {
        "id": 123456,
        "name": "CI",
        "path": ".github/workflows/ci.yml",
        "state": "active",
        "recentRuns": [
          {
            "id": 789012,
            "status": "completed",
            "conclusion": "success",
            "branch": "main",
            "commitSha": "abc123",
            "commitMessage": "Fix bug",
            "triggeredAt": "2026-01-19T10:00:00Z",
            "completedAt": "2026-01-19T10:15:00Z",
            "runNumber": 42,
            "event": "push",
            "jobs": [
              {
                "id": 345678,
                "name": "build",
                "status": "completed",
                "conclusion": "success",
                "startedAt": "2026-01-19T10:01:00Z",
                "completedAt": "2026-01-19T10:14:00Z"
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "totalWorkflows": 3,
      "totalRuns": 15,
      "latestRunStatus": "completed"
    }
  }
}
```

### 2. Fetch Workflows Only

**Endpoint:** `GET /pipelines/github/:repoIdentifier/workflows`

Fetches only workflow definitions without runs (lighter/faster request).

**Parameters:**

- `repoIdentifier` (path): Repository in format `owner/repo`
- `userId` (query): User ID to authenticate with GitHub App

**Example Request:**

```bash
GET /pipelines/github/microsoft%2Fvscode/workflows?userId=user123
```

### 3. Health Check

**Endpoint:** `GET /pipelines/github/health`

Check if the GitHub pipeline service is running.

## Adding New Providers

To add support for Jenkins, GitLab, or other CI/CD platforms:

1. **Create provider directory**: `src/pipelines/jenkins/`

2. **Implement the interface**: Create `jenkins-pipeline.service.ts` implementing `IPipelineProvider`

3. **Create controller**: Create `jenkins-pipeline.controller.ts` with endpoints

4. **Register in module**: Add to `pipelines.module.ts`:
   ```typescript
   @Module({
     controllers: [GithubPipelineController, JenkinsPipelineController],
     providers: [GithubPipelineService, JenkinsPipelineService],
   })
   ```

## Authentication

The pipeline services use the GitHub App integration for authentication:

- User must have authorized the GitHub App
- GitHub App must be installed on the repository/organization
- The service automatically fetches installation tokens via `GithubAppService`

## Performance Considerations

- **Pagination**: Current implementation fetches recent runs (default: 10 per workflow)
- **Logs**: Job logs are not fetched by default (can be expensive). Uncomment code in service to enable
- **Caching**: Consider adding Redis caching for frequently accessed repositories
- **Rate Limits**: GitHub API has rate limits; monitor and implement retry logic if needed

## Future Enhancements

- [ ] Add pagination support for large repositories
- [ ] Implement caching layer (Redis)
- [ ] Add webhook support for real-time updates
- [ ] Support for fetching specific workflow runs by ID
- [ ] Parallel fetching optimization
- [ ] Job log streaming/fetching on demand
- [ ] Jenkins provider implementation
- [ ] GitLab provider implementation
