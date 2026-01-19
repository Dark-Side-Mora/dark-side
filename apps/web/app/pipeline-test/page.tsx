"use client";

import { useState, useEffect } from "react";
import styles from "../github-test/github-test.module.css";

const API_URL = "http://localhost:3000";

interface Installation {
  id: string;
  installationId: string;
  accountLogin: string;
  accountType: string;
  repositories: Repository[];
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
}

interface PipelineData {
  repository: {
    id: number;
    name: string;
    fullName: string;
    provider: string;
  };
  workflows: Workflow[];
  summary: {
    totalWorkflows: number;
    totalRuns: number;
    latestRunStatus?: string;
  };
}

interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  content?: string; // Workflow file content
  recentRuns: WorkflowRun[];
}

interface WorkflowRun {
  id: number;
  status: string | null;
  conclusion: string | null;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  triggeredAt: string;
  completedAt: string | null;
  runNumber: number;
  event: string;
  jobs: Job[];
}

interface Job {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  logs?: string;
}

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  suggestedFix?: string;
  category: string;
}

interface SecurityAnalysis {
  analysisId: string;
  timestamp: string;
  overallRisk: "critical" | "high" | "medium" | "low";
  summary: string;
  issues: SecurityIssue[];
}

interface AnalysisResponse {
  pipelineData: PipelineData;
  securityAnalysis: SecurityAnalysis;
}

export default function PipelineTestPage() {
  const [userId, setUserId] = useState("test-user-123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [securityAnalysis, setSecurityAnalysis] =
    useState<SecurityAnalysis | null>(null);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const handleFetchInstallations = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/integrations/github-app/installations?userId=${userId}`,
      );
      const data = await response.json();

      if (data.data?.installations) {
        setInstallations(data.data.installations);
        setMessage(`Found ${data.data.installations.length} installations`);
      } else {
        setMessage(
          "No GitHub App installations found. Please install the app first.",
        );
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPipelineData = async () => {
    if (!selectedRepo) {
      setMessage("Please select a repository first");
      return;
    }

    setLoading(true);
    setMessage("");
    setPipelineData(null);
    setSecurityAnalysis(null);

    try {
      const encodedRepo = encodeURIComponent(selectedRepo);
      const response = await fetch(
        `${API_URL}/pipelines/github/${encodedRepo}/data?userId=${userId}&limit=5`,
      );
      const data = await response.json();

      if (data.data) {
        setPipelineData(data.data);
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage("No pipeline data found");
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSecurity = async () => {
    if (!selectedRepo) {
      setMessage("Please select a repository first");
      return;
    }

    setLoading(true);
    setMessage("");
    setSecurityAnalysis(null);

    try {
      const encodedRepo = encodeURIComponent(selectedRepo);
      const response = await fetch(
        `${API_URL}/pipelines/github/${encodedRepo}/analyze?userId=${userId}`,
      );
      const data = await response.json();

      if (data.data) {
        setPipelineData(data.data.pipelineData);
        setSecurityAnalysis(data.data.securityAnalysis);
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage("Analysis failed");
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null, conclusion: string | null) => {
    if (conclusion === "success") return "#28a745";
    if (conclusion === "failure") return "#dc3545";
    if (conclusion === "cancelled") return "#6c757d";
    if (status === "in_progress" || status === "queued") return "#ffc107";
    return "#6c757d";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const toggleRunExpansion = (runId: number) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "#dc3545";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const getSeverityColor = (severity: string) => {
    return getRiskColor(severity);
  };

  return (
    <div className={styles.container}>
      <h1>GitHub Actions Pipeline Test</h1>
      <p className={styles.description}>
        Test the pipeline data fetching endpoint to view workflows, runs, jobs,
        and logs.
      </p>

      <div className={styles.section}>
        <h2>1. Setup</h2>
        <div className={styles.inputGroup}>
          <label>User ID (for testing):</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="test-user-123"
            className={styles.input}
          />
        </div>
        <button
          onClick={handleFetchInstallations}
          disabled={loading || !userId}
          className={styles.button}
        >
          {loading ? "Loading..." : "Fetch Repositories"}
        </button>
      </div>

      {installations.length > 0 && (
        <div className={styles.section}>
          <h2>2. Select Repository</h2>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className={styles.input}
          >
            <option value="">-- Select a repository --</option>
            {installations.map((installation) =>
              installation.repositories.map((repo) => (
                <option key={repo.id} value={repo.fullName}>
                  {repo.fullName} {repo.private ? "🔒" : ""}
                </option>
              )),
            )}
          </select>
        </div>
      )}

      {selectedRepo && (
        <div className={styles.section}>
          <h2>3. Fetch & Analyze Pipeline</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={handleFetchPipelineData}
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Fetching..." : "Fetch Workflows & Runs"}
            </button>
            <button
              onClick={handleAnalyzeSecurity}
              disabled={loading}
              className={styles.button}
              style={{ background: "#ff6b6b" }}
            >
              {loading ? "Analyzing..." : "🔒 Analyze Security"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={
            message.includes("Error") || message.includes("❌")
              ? styles.error
              : styles.success
          }
        >
          {message}
        </div>
      )}

      {pipelineData && (
        <div className={styles.section}>
          <h2>Pipeline Data</h2>
          <div className={styles.infoBox}>
            <h3>📊 Summary</h3>
            <p>
              <strong>Repository:</strong> {pipelineData.repository.fullName}
            </p>
            <p>
              <strong>Total Workflows:</strong>{" "}
              {pipelineData.summary.totalWorkflows}
            </p>
            <p>
              <strong>Total Runs (recent):</strong>{" "}
              {pipelineData.summary.totalRuns}
            </p>
            {pipelineData.summary.latestRunStatus && (
              <p>
                <strong>Latest Status:</strong>{" "}
                {pipelineData.summary.latestRunStatus}
              </p>
            )}
          </div>

          <div className={styles.workflowList}>
            {pipelineData.workflows.map((workflow) => (
              <div key={workflow.id} className={styles.installationCard}>
                <h3>
                  {workflow.name}{" "}
                  <span className={styles.badge}>{workflow.state}</span>
                </h3>
                <p className={styles.hint}>
                  <code>{workflow.path}</code>
                </p>

                {workflow.content && (
                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#0070f3",
                        fontWeight: 500,
                      }}
                    >
                      📄 View Workflow File
                    </summary>
                    <pre className={styles.workflowContent}>
                      {workflow.content}
                    </pre>
                  </details>
                )}

                {workflow.recentRuns.length > 0 ? (
                  <div className={styles.runsSection}>
                    <h4>Recent Runs:</h4>
                    {workflow.recentRuns.map((run) => (
                      <div key={run.id} className={styles.runCard}>
                        <div
                          className={styles.runHeader}
                          onClick={() => toggleRunExpansion(run.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className={styles.runInfo}>
                            <span
                              className={styles.statusBadge}
                              style={{
                                backgroundColor: getStatusColor(
                                  run.status,
                                  run.conclusion,
                                ),
                              }}
                            >
                              {run.conclusion || run.status}
                            </span>
                            <strong>Run #{run.runNumber}</strong>
                            <span className={styles.badge}>{run.branch}</span>
                            <span className={styles.badge}>{run.event}</span>
                          </div>
                          <span>{expandedRun === run.id ? "▼" : "▶"}</span>
                        </div>

                        {expandedRun === run.id && (
                          <div className={styles.runDetails}>
                            <p>
                              <strong>Commit:</strong>{" "}
                              <code>{run.commitSha.substring(0, 7)}</code>
                            </p>
                            {run.commitMessage && (
                              <p>
                                <strong>Message:</strong> {run.commitMessage}
                              </p>
                            )}
                            <p>
                              <strong>Triggered:</strong>{" "}
                              {formatDate(run.triggeredAt)}
                            </p>
                            <p>
                              <strong>Completed:</strong>{" "}
                              {formatDate(run.completedAt)}
                            </p>

                            {run.jobs.length > 0 && (
                              <div className={styles.jobsSection}>
                                <h5>Jobs ({run.jobs.length}):</h5>
                                {run.jobs.map((job) => (
                                  <div key={job.id} className={styles.jobCard}>
                                    <div className={styles.jobHeader}>
                                      <span
                                        className={styles.statusBadge}
                                        style={{
                                          backgroundColor: getStatusColor(
                                            job.status,
                                            job.conclusion,
                                          ),
                                        }}
                                      >
                                        {job.conclusion || job.status}
                                      </span>
                                      <strong>{job.name}</strong>
                                    </div>
                                    <div className={styles.jobDetails}>
                                      <p>
                                        <strong>Started:</strong>{" "}
                                        {formatDate(job.startedAt)}
                                      </p>
                                      <p>
                                        <strong>Completed:</strong>{" "}
                                        {formatDate(job.completedAt)}
                                      </p>
                                      {job.logs && (
                                        <details>
                                          <summary>View Logs</summary>
                                          <pre className={styles.logs}>
                                            {job.logs}
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.hint}>No recent runs found</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {securityAnalysis && (
        <div className={styles.section}>
          <h2>🔐 Security Analysis Results</h2>
          <div
            className={styles.infoBox}
            style={{
              borderLeftColor: getRiskColor(securityAnalysis.overallRisk),
            }}
          >
            <h3>Overall Risk Level</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <span
                className={styles.statusBadge}
                style={{
                  backgroundColor: getRiskColor(securityAnalysis.overallRisk),
                  padding: "0.5rem 1rem",
                  fontSize: "1rem",
                }}
              >
                {securityAnalysis.overallRisk.toUpperCase()}
              </span>
              <p style={{ margin: 0, color: "#555" }}>
                <strong>Analysis ID:</strong>{" "}
                {securityAnalysis.analysisId.substring(0, 8)}...
              </p>
            </div>
            <p>
              <strong>Summary:</strong> {securityAnalysis.summary}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>
              Analyzed: {new Date(securityAnalysis.timestamp).toLocaleString()}
            </p>
          </div>

          {securityAnalysis.issues.length > 0 ? (
            <div style={{ marginTop: "1.5rem" }}>
              <h3>Issues Found ({securityAnalysis.issues.length})</h3>
              <div className={styles.issuesList}>
                {securityAnalysis.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={styles.issueCard}
                    style={{
                      borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedIssue(expandedIssue === index ? null : index)
                      }
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            className={styles.statusBadge}
                            style={{
                              backgroundColor: getSeverityColor(issue.severity),
                            }}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          <span
                            className={styles.badge}
                            style={{ background: "#e0e0e0", color: "#333" }}
                          >
                            {issue.category}
                          </span>
                        </div>
                        <h4 style={{ margin: "0.5rem 0", color: "#333" }}>
                          {issue.title}
                        </h4>
                      </div>
                      <span style={{ fontSize: "1.2rem", marginLeft: "1rem" }}>
                        {expandedIssue === index ? "▼" : "▶"}
                      </span>
                    </div>

                    {expandedIssue === index && (
                      <div
                        style={{
                          marginTop: "1rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid #e0e0e0",
                        }}
                      >
                        <p>
                          <strong>Description:</strong> {issue.description}
                        </p>
                        {issue.location && (
                          <p>
                            <strong>Location:</strong>{" "}
                            <code
                              style={{
                                background: "#f5f5f5",
                                padding: "0.2rem 0.4rem",
                              }}
                            >
                              {issue.location}
                            </code>
                          </p>
                        )}
                        <p>
                          <strong>Recommendation:</strong>{" "}
                          {issue.recommendation}
                        </p>
                        {issue.suggestedFix && (
                          <details>
                            <summary
                              style={{
                                color: "#0070f3",
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              💡 Suggested Fix
                            </summary>
                            <pre
                              className={styles.workflowContent}
                              style={{ marginTop: "0.5rem" }}
                            >
                              {issue.suggestedFix}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.success} style={{ marginTop: "1rem" }}>
              ✅ No security issues found! Your workflow looks good.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
