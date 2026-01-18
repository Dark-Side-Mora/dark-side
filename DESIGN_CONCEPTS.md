# CI-Insight: UI/UX Wireframe Concepts

This document provides detailed wireframe descriptions for the CI-Insight platform to aid in Figma prototyping.

---

## 1. Global Navigation
- **Sidebar**: Collapsible drawer.
  - Logo: `CI-Insight` (Neon Gradient).
  - Links: Dashboard, Pipelines, Logs, Security, Analytics, Learning Lab, Settings.
  - Bottom: User settings, Organization switcher.
- **Top Bar**:
  - Global Search (CMD+K).
  - Notification Bell (Active alerts for failed builds or security risks).
  - Project Dropdown (Filter view by specific repository).

---

## 2. Dashboard (Main View)
- **Top Row**: Summary Cards.
  - `Active Pipelines`: Current count with dynamic pulse animation.
  - `MTTR`: Last 7 days trend.
  - `Global Success Rate`: Guage chart.
  - `Security Health`: Circular progress bar.
- **Middle Section**: Pipeline Visualizer.
  - Interactive Canvas: Nodes (Jobs/Stages) connected by Edges (Dependencies).
  - Interaction: Click node to open fly-out menu with "View Logs", "Rerun Job", "Security Findings".
- **Bottom Section**: Recent Activity Table.
  - Columns: Status, Branch, Commit, Triggered By, Duration, Action.

---

## 3. Log Explorer
- **Sidebar (Within Page)**: Recent runs list.
- **Header**: Search bar + Log level filters (Info, Warning, Error).
- **Main Terminal**:
  - Monospace font (JetBrains Mono/Fira Code).
  - Alternating row highlights.
  - Clickable timestamps to copy link.
  - Regex search toggle.
- **AI Sidebar (Collapsible)**:
  - "Explain Error": Triggered when an error is detected.
  - "Suggested Fix": Button to open a PR or display a code snippet.

---

## 4. Security Analyzer
- **Dashboard**:
  - Current Risk Level (Critical/High/Medium/Low).
  - Top 5 recurring vulnerabilities.
- **Configuration Scan View**:
  - YAML preview on the left.
  - List of findings on the right.
  - Inline annotations: Lines in the YAML causing the issue are highlighted.
  - "Learn More" links to the Interactive Learning module.

---

## 5. Metrics & Trends
- **Interactions**:
  - Zoomable charts (Timebrush at the bottom).
  - Hover tooltips showing exact values.
  - "Compare with previous period" checkbox.
- **Layout**: Grid of charts (Recharts/D3).

---

## 6. Learning Lab (Interactive Module)
- **Course List**: "CI/CD Security 101", "Optimizing Build Caching", "Docker in CI".
- **Lab Interface**:
  - Textual guidance on the left.
  - Interactive code editor (Monaco Editor) in the center.
  - Terminal output at the bottom.
  - Success checklist on the right.
