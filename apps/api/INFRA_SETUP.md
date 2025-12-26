# CI-Insight Infrastructure Setup Report

This document summarizes the steps taken to initialize the CI-Insight platform, the technical challenges encountered, and how they were resolved.

---

## 🛠️ Infrastructure Overview

The platform uses a modern "Full-Stack Intelligence" stack:
- **Primary Database**: PostgreSQL via **Supabase** (Managed with Prisma).
- **Log Management**: **Bonsai** (Managed OpenSearch).
- **Real-time & Caching**: **Upstash Redis** (HTTP Mode).
- **Authentication**: **Supabase Auth** (Email + Google).

---

## 🚀 What Was Accomplished

1. **Database Schema Design**: 
   - Created a multi-model Prisma schema covering `Project`, `Pipeline`, `Job`, and `SecurityFinding`.
   - Optimized for Supabase Connection Pooling (PgBouncer).

2. **Backend Service Layer (NestJS)**:
   - `PrismaService`: Handles persistent data storage.
   - `RedisService`: Implements HTTP-based real-time status updates (TTL-backed).
   - `OpenSearchService`: Provides a high-performance log ingestion pipeline.

3. **Environment Configuration**:
   - Automated `.env` creation based on user-provided credentials.
   - Integrated `ConfigModule` for global configuration management.

---

## ⚠️ Challenges & Resolutions

### 1. Prisma 7 Configuration Conflict
- **Error**: `P1012 - The datasource property 'url' is no longer supported in schema files.`
- **Cause**: Prisma 7 moved database connection URLs out of `schema.prisma` into a new `prisma.config.ts` system to improve performance and security.
- **Attempted Fix**: Created `prisma.config.ts`, `prisma.config.js`, and `prisma.config.mjs`. However, the CLI encountered parsing issues within the NestJS monorepo environment.
- **Final Resolution**: 
  - **Downgraded to Prisma 6.19.1**. 
  - Restored `env("DATABASE_URL")` to the schema.
  - This maintained compatibility with the standard environment-variable workflow while ensuring stability for the MVP.

### 2. Environment Variable Gaps
- **Error**: Schema validation failing during `prisma generate`.
- **Cause**: The `.env` file was initially missing or incomplete.
- **Resolution**: Prompted the user for credentials, created the validated `.env` in `apps/api/`, and verified connectivity.

---

## 📋 Current System Status

| Component | Status | Service |
| :--- | :--- | :--- |
| **Persistence** | ✅ Verified | Supabase / Prisma |
| **Real-time** | ✅ Verified | Upstash REST |
| **Logs** | ✅ Verified | Bonsai / OpenSearch |
| **Schema** | ✅ Deployed | Version 6.x |

---

## 🏗️ How to Run
```bash
# In apps/api
npx prisma generate  # Ensure client matches schema
npm run dev          # Start the backend
```
