"use client";

import React, { useState } from "react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: "Getting Started" },
    { id: "workspaces", title: "Workspaces" },
    { id: "projects", title: "Projects" },
    { id: "integrations", title: "Integrations" },
    { id: "run-explorer", title: "Run Explorer" },
    { id: "security", title: "Security" },
    { id: "learning-hub", title: "Learning Hub" },
    { id: "analytics", title: "Analytics" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: "240px",
          position: "sticky",
          top: "96px",
          height: "fit-content",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <h3
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}
        >
          Documentation
        </h3>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border:
                activeSection === section.id
                  ? "1px solid rgba(6, 182, 212, 0.2)"
                  : "1px solid transparent",
              backgroundColor:
                activeSection === section.id
                  ? "rgba(6, 182, 212, 0.1)"
                  : "transparent",
              color:
                activeSection === section.id
                  ? "var(--accent-cyan)"
                  : "var(--text-secondary)",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            {section.title}
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: "900px" }}>
        <div
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "48px",
          }}
        >
          {activeSection === "getting-started" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Getting Started with CI-Insight
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                CI-Insight helps you monitor and analyze your CI/CD pipelines by
                connecting to GitHub Actions and Jenkins.
              </p>

              <Section title="Quick Start">
                <ol
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                  }}
                >
                  <li>Sign in with your email or GitHub account</li>
                  <li>
                    Create a workspace or connect your GitHub organization
                  </li>
                  <li>
                    Add projects by connecting GitHub repositories or Jenkins
                    jobs
                  </li>
                  <li>View pipeline runs in the Explorer</li>
                </ol>
              </Section>

              <Section title="Key Features">
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                  }}
                >
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      GitHub Integration:
                    </strong>{" "}
                    Connect via GitHub App to sync repositories and workflows
                  </li>
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      Jenkins Support:
                    </strong>{" "}
                    Monitor local and hosted Jenkins instances
                  </li>
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      Workspace Management:
                    </strong>{" "}
                    Organize projects by team or organization
                  </li>
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      Pipeline Viewer:
                    </strong>{" "}
                    Browse and filter workflow runs
                  </li>
                </ul>
              </Section>

              <Section title="System Requirements">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  CI-Insight is a web application that works in any modern
                  browser:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+</li>
                  <li>Internet connection</li>
                  <li>JavaScript enabled</li>
                </ul>
              </Section>
            </div>
          )}

          {activeSection === "workspaces" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Workspaces
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Workspaces help you organize your projects by team,
                organization, or environment.
              </p>

              <Section title="Creating a Workspace">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  To create a new workspace:
                </p>
                <ol
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Click "Add Workspace" in the sidebar</li>
                  <li>Enter a workspace name</li>
                  <li>Provide a unique domain identifier</li>
                  <li>Select your primary CI/CD provider</li>
                  <li>Click "Create Workspace"</li>
                </ol>
              </Section>

              <Section title="Workspace Types">
                <CodeBlock>
                  {`GitHub: Sync automatically with GitHub organizations
Jenkins: Connect to Jenkins servers
Local: Create standalone workspaces for custom setups`}
                </CodeBlock>
              </Section>

              <Section title="Workspace Management">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Workspace owners can:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Invite team members via email</li>
                  <li>Manage member roles (owner, admin, member)</li>
                  <li>View all projects in the workspace</li>
                  <li>Rename or delete the workspace</li>
                </ul>
              </Section>
            </div>
          )}

          {activeSection === "projects" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Projects
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Projects represent individual repositories and their CI/CD
                pipelines within a workspace.
              </p>

              <Section title="Adding a Project">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  You can add projects in two ways:
                </p>
                <ol
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      Manual Import:
                    </strong>{" "}
                    Click "Add Project" and select from your repositories
                  </li>
                  <li>
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      Auto-Sync:
                    </strong>{" "}
                    Projects are automatically discovered when you connect
                    integrations
                  </li>
                </ol>
              </Section>

              <Section title="Project Dashboard">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Each project shows:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Repository name and provider (GitHub/Jenkins)</li>
                  <li>Recent pipeline runs</li>
                  <li>Quick access to Run Explorer</li>
                  <li>Project settings</li>
                </ul>
              </Section>

              <Section title="Managing Projects">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  From the Projects page, you can:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>View all projects in the current workspace</li>
                  <li>Add new projects from GitHub or Jenkins</li>
                  <li>Search and filter projects</li>
                  <li>Remove projects you no longer need</li>
                </ul>
              </Section>
            </div>
          )}

          {activeSection === "integrations" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Integrations
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Connect your favorite CI/CD platforms and tools to CI-Insight.
              </p>

              <Section title="GitHub Actions">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Connect your GitHub account to sync repositories
                  automatically.
                </p>
                <CodeBlock>
                  {`Steps to integrate:
1. Go to Integrations page
2. Click "Connect GitHub"
3. Authorize the CI-Insight GitHub App
4. Select repositories to monitor
5. Repositories sync automatically to your workspace`}
                </CodeBlock>
              </Section>

              <Section title="Jenkins">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Connect to Jenkins servers to monitor build jobs.
                </p>
                <CodeBlock>
                  {`Configuration:
1. Go to Integrations page
2. Click "Add Jenkins Server"
3. Enter Jenkins URL and credentials
4. Test connection
5. Save configuration`}
                </CodeBlock>
              </Section>

              <Section title="Integration Status">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  View all your connected integrations on the Integrations page.
                  You can disconnect or reconfigure them at any time.
                </p>
              </Section>
            </div>
          )}

          {activeSection === "run-explorer" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Run Explorer
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Dive deep into individual pipeline runs to understand
                performance, identify bottlenecks, and troubleshoot failures.
              </p>

              <Section title="Viewing Pipeline Runs">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  The Run Explorer shows:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>List of all workflow runs for a project</li>
                  <li>Run status (success, failure, in progress)</li>
                  <li>Trigger information (commit, branch, user)</li>
                  <li>Execution timestamps</li>
                </ul>
              </Section>

              <Section title="Filtering Runs">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Filter runs by:
                </p>
                <CodeBlock>
                  {`- Status (all, success, failed, running)
- Date range
- Branch name
- Triggered by`}
                </CodeBlock>
              </Section>

              <Section title="Navigation">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Click on any project in the sidebar to view its runs in the
                  Explorer. Use the search and filter options to find specific
                  runs quickly.
                </p>
              </Section>
            </div>
          )}
          {activeSection === "security" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Security
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Protect your CI/CD pipelines with comprehensive security
                scanning and vulnerability detection.
              </p>

              <Section title="Security Scanning">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  CI-Insight automatically scans for:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Exposed secrets and credentials</li>
                  <li>Dependency vulnerabilities (CVEs)</li>
                  <li>Misconfigured pipeline permissions</li>
                  <li>Outdated dependencies</li>
                  <li>Insecure Docker base images</li>
                </ul>
              </Section>

              <Section title="Severity Levels">
                <CodeBlock>
                  {`Critical: Immediate action required
High: Fix within 7 days
Medium: Address in next sprint
Low: Best practice recommendations
Info: General security notices`}
                </CodeBlock>
              </Section>

              <Section title="Remediation">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  For each finding, CI-Insight provides:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Detailed description of the vulnerability</li>
                  <li>Step-by-step remediation instructions</li>
                  <li>Code snippets with fixes</li>
                  <li>Links to security advisories</li>
                  <li>Automated fix suggestions (where available)</li>
                </ul>
              </Section>

              <Section title="Compliance">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Track compliance with industry standards:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>OWASP Top 10</li>
                  <li>CIS Benchmarks</li>
                  <li>SOC 2 requirements</li>
                  <li>GDPR data handling</li>
                </ul>
              </Section>
            </div>
          )}
          {activeSection === "learning-hub" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Learning Hub
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Get AI-powered insights and recommendations to improve your
                CI/CD practices.
              </p>

              <Section title="Learning Paths">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Follow curated learning paths to master CI/CD:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>CI/CD Fundamentals</li>
                  <li>Advanced Pipeline Optimization</li>
                  <li>Security Best Practices</li>
                  <li>Multi-Cloud Deployments</li>
                  <li>Container Orchestration</li>
                </ul>
              </Section>

              <Section title="AI Insights">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Our AI assistant can help you:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Debug failing builds</li>
                  <li>Understand error messages</li>
                  <li>Optimize workflow configurations</li>
                  <li>Suggest relevant documentation</li>
                </ul>
              </Section>
            </div>
          )}

          {activeSection === "analytics" && (
            <div>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Analytics
              </h1>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                }}
              >
                Visualize trends, track KPIs, and make data-driven decisions
                about your CI/CD infrastructure.
              </p>

              <Section title="Dashboard Metrics">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  The analytics dashboard displays:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>Overall success rate</li>
                  <li>Average build duration</li>
                  <li>Deployment frequency</li>
                  <li>Mean time to recovery (MTTR)</li>
                  <li>Change failure rate</li>
                  <li>Lead time for changes</li>
                </ul>
              </Section>

              <Section title="Custom Reports">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Create custom reports to track specific metrics:
                </p>
                <CodeBlock>
                  {`Example Report: Monthly CI/CD Performance
- Total builds run
- Success vs. failure ratio
- Cost analysis
- Most active repositories
- Team productivity metrics
- Infrastructure utilization`}
                </CodeBlock>
              </Section>

              <Section title="Exportable Data">
                <p
                  style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
                >
                  Export analytics data in multiple formats:
                </p>
                <ul
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: "1.8",
                    paddingLeft: "24px",
                    marginTop: "12px",
                  }}
                >
                  <li>CSV for spreadsheet analysis</li>
                  <li>JSON for custom integrations</li>
                  <li>PDF for executive reports</li>
                </ul>
              </Section>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  // Reusable Components
  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    );
  }

  function CodeBlock({ children }: { children: string }) {
    return (
      <pre
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          overflow: "auto",
          marginTop: "12px",
        }}
      >
        <code
          style={{
            fontSize: "13px",
            fontFamily: "monospace",
            color: "var(--accent-cyan)",
            lineHeight: "1.6",
          }}
        >
          {children}
        </code>
      </pre>
    );
  }
}
