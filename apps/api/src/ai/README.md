# AI Security Analysis Module

This module provides AI-powered security analysis for GitHub Actions workflows using Google's Gemini API.

## Architecture

The AI module follows an extensible provider pattern:

```
src/ai/
├── interfaces/
│   └── ai-provider.interface.ts    # Base interface for all AI providers
├── gemini/
│   ├── gemini-security.service.ts  # Gemini implementation
│   └── dto/
│       ├── analyze-workflow-security.dto.ts
│       └── security-analysis-response.dto.ts
└── ai.module.ts
```

## Integration with Pipelines

The `PipelineAnalysisService` (in `pipelines/services/`) acts as an orchestrator:

1. Receives `PipelineData` from GitHub pipeline fetching
2. Extracts the latest workflow run and its logs
3. Calls Gemini security service with workflow file + logs
4. Aggregates response with pipeline data
5. Returns complete analysis response

## Internal Endpoint

**INTERNAL USE ONLY** - Not exposed to external API

```
GET /pipelines/github/:repoIdentifier/analyze?userId=xxx
```

### Response Structure

```json
{
  "statusCode": 200,
  "message": "Pipeline analyzed successfully",
  "data": {
    "pipelineData": {
      "repository": { ... },
      "workflows": [ ... ],
      "summary": { ... }
    },
    "securityAnalysis": {
      "analysisId": "uuid",
      "timestamp": "2026-01-19T...",
      "overallRisk": "medium",
      "summary": "...",
      "issues": [
        {
          "severity": "high",
          "title": "Exposed secret in logs",
          "description": "...",
          "location": "line 42",
          "recommendation": "...",
          "suggestedFix": "code snippet",
          "category": "secrets"
        }
      ]
    }
  }
}
```

## Gemini Integration

The Gemini security service performs deep analysis looking for:

- **Secrets/Credentials**: Exposed API keys, tokens, passwords
- **Permissions**: Overly permissive write/read-all permissions
- **Dependencies**: Vulnerable or unvalidated versions
- **Code Quality**: Hardcoded values, insecure practices
- **Best Practices**: Missing SBOM, unencrypted storage, missing branch protection rules

## Adding New AI Providers

To add support for OpenAI, Claude, or other LLMs:

1. **Create provider directory**: `src/ai/openai/`
2. **Implement interface**: Create `openai-security.service.ts` implementing `IAIProvider`
3. **Add DTOs**: Create request/response DTOs
4. **Register in module**: Update `ai.module.ts`:
   ```typescript
   @Module({
     imports: [ConfigModule],
     providers: [GeminiSecurityService, OpenAISecurityService],
     exports: [GeminiSecurityService, OpenAISecurityService],
   })
   ```
5. **Update analysis service**: Allow switching providers via config

## Configuration

Required environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
```

## Future Enhancements

- [ ] Support for multiple AI providers (OpenAI, Claude)
- [ ] Caching of analysis results in database
- [ ] Comparison analysis across multiple runs
- [ ] Custom security policies/rules
- [ ] Integration with secret management systems
- [ ] Scheduled security scanning
- [ ] Vulnerability tracking over time
- [ ] Auto-remediation suggestions with PR creation
