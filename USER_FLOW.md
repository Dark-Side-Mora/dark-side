# CI-Insight: Frontend User Journey & Flow

This document outlines the "Clean Flow" for the CI-Insight platform, designed for Team DarkSide's project proposal.

---

## 🌊 Core Application Flow

The application follows a logical progression from barrier entry to actionable intelligence.

### 1. Authentication (Barrier Entry)
- **Route**: `/auth/login`
- **Actions**:
  - User authenticates via **Supabase Auth** (GitHub/Email).
  - On success, redirect to the **Global Dashboard**.

### 2. Global Dashboard (Executive Summary)
- **Route**: `/`
- **View**:
  - High-level KPIs (Success Rate, MTTR, Security Score).
  - Interactive Pipeline Visualization of the most recent/critical project.
  - Recent activity feed across the organization.
- **Flow**: Click on a specific pipeline in the table or graph to see details.

### 3. Pipeline Listing & Management
- **Route**: `/pipelines`
- **View**:
  - Searchable list of all repositories (GitHub/GitLab).
  - Quick status badges and health indicators.
- **Flow**: Select a repository to drill down into its execution history (`/logs`).

### 4. Detailed Execution & AI Insight (Debugging)
- **Route**: `/logs`
- **View**:
  - Split view: Historical runs on the left, Terminal output on the right.
  - **Gemini AI Integration**: Contextual insights displayed directly within the logs explaining failures or suggesting optimizations.
- **Flow**: Toggle between different builds to correlate changes with failures.

### 5. Security & Compliance (Risk Management)
- **Route**: `/security`
- **View**:
  - **Security Score**: A global metric calculated from recent scans.
  - **Vulnerability Feed**: List of findings (Secrets, Insecure Docker images, etc.).
- **Flow**: Click "Remediate" to see AI-suggested code fixes.

### 6. Analytics & Performance (Trends)
- **Route**: `/analytics`
- **View**:
  - Long-term trends (Build duration over 12 months).
  - DORA Metrics (Deployment frequency, Lead time).
- **Flow**: Hover over Recharts-powered graphs to see specific data points.

---

## 🛠 Navigation Architecture

The **Sidebar** acts as the primary navigational hub, ensuring that no matter where the user is, they can jump to a critical area (Security, Logs, or Analytics) in one click.

### Modal & Interaction Flow
- **New Pipeline**: A global "New Pipeline" button opens a modal to connect new repositories.
- **Toasts**: Success/Failure notifications appear in the bottom-right after actions (e.g., "Scan Completed").
- **AI Sidebar**: In the detailed log view, the AI insight can be expanded to show full remediation steps.
