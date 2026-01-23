"use client";

import React, { useRef, useState, useEffect } from "react";
import { Shell } from "../../components/ui/Shell";
import { Card } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGithubPipeline } from "@/lib/project/useGithubPipeline";
import type { WorkflowRun } from "@/lib/project/useGithubPipeline";

// --- Professional Node Component with Fixed Dimensions for Alignment ---
const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;

const PipelineNode = ({ name, status, duration, meta, top, left }: any) => {
  const isHealthy = status === "success";
  const isFailed = status === "failed";
  const isRunning = status === "running";
  const isPending = status === "pending";

  const color = isHealthy
    ? "var(--success)"
    : isFailed
      ? "var(--error)"
      : isRunning
        ? "var(--accent-cyan)"
        : "#FFD600"; // yellow for pending

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${NODE_WIDTH}px`,
        height: `${NODE_HEIGHT}px`,
        padding: "20px",
        borderRadius: "20px",
        backgroundColor: "var(--bg-card)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isRunning ? "var(--accent-cyan)" : isFailed ? "rgba(239, 68, 68, 0.4)" : "var(--border)"}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "8px",
        zIndex: 10,
        opacity: isPending ? 0.4 : 1,
        boxShadow: isRunning ? "0 0 25px rgba(6, 182, 212, 0.15)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {status}
          </span>
        </div>
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-secondary)",
            fontWeight: 600,
          }}
        >
          {duration}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {meta}
        </div>
      </div>
    </div>
  );
};

// --- Parse jobs and dependencies from workflow YAML ---
// --- Improved: Parse only actual jobs, ignore reserved/step keys ---
function parseJobsFromYaml(yaml: string) {
  // Find jobs block
  const jobsBlockMatch = yaml.match(/jobs:\s*([\s\S]*)/);
  if (!jobsBlockMatch) return { jobs: [], edges: [] };
  const jobsBlock = jobsBlockMatch[1];
  if (!jobsBlock) return { jobs: [], edges: [] };
  // Reserved/step keys to ignore as jobs
  const reserved = new Set([
    "runs-on",
    "if",
    "steps",
    "run",
    "uses",
    "with",
    "env",
    "needs",
    "name",
    "timeout-minutes",
    "strategy",
    "outputs",
    "permissions",
    "defaults",
    "container",
    "services",
    "continue-on-error",
    "concurrency",
    "secrets",
    "node-version",
    "CI",
  ]);
  // Find all top-level job keys (by indentation)
  const lines = jobsBlock.split(/\r?\n/);
  const jobs = [];
  const jobMap: { [key: string]: { needs: string[]; name: string } } = {};
  let currentJob = null;
  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i];
    if (typeof line === "string") {
      line = line.replace(/#.*/, "").trimEnd(); // Remove comments
      if (!line.trim()) continue; // skip blank lines
      const m = line.match(/^(\s*)([a-zA-Z0-9_-]+):/);
      if (m && m[1] && m[1].length === 2 && m[2] && !reserved.has(m[2])) {
        // 2 spaces = top-level under jobs
        const name = m[2];
        jobs.push({ name });
        jobMap[name] = { needs: [], name };
        currentJob = name;
      } else if (currentJob && /needs:/.test(line)) {
        // Parse needs for this job
        const needsSplit = line.split("needs:");
        if (needsSplit[1]) {
          let needsVal: string | string[] = needsSplit[1].trim();
          if (needsVal.startsWith("[")) {
            needsVal = needsVal
              .replace(/\[|\]/g, "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            needsVal = [needsVal];
          }
          if (currentJob && jobMap?.[currentJob]) {
            jobMap[currentJob]!.needs = needsVal;
          }
        }
      }
    }
  }
  // Build edges
  interface ParsedJob {
    name: string;
    needs: string[];
  }
  interface JobMap {
    [key: string]: ParsedJob;
  }
  interface Edge {
    from: string;
    to: string;
  }
  const edges: Edge[] = [];
  Object.values(jobMap).forEach((job: any) => {
    job.needs.forEach((need: string) => {
      if (jobMap[need]) edges.push({ from: need, to: job.name });
    });
  });
  return { jobs: Object.values(jobMap), edges };
}

export default function RunExplorerPage() {
  // --- State for API Data ---
  const [userId] = useState("test-user-123");
  const {
    repos,
    selectedRepo,
    setSelectedRepo,
    pipelineData,
    loading,
    message,
    fetchRepos,
    fetchPipeline,
  } = useGithubPipeline(userId);
  const [view, setView] = useState("visualization");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track previous repo to trigger loading
  const prevRepoRef = useRef<string | null>(null);

  // When selectedRepo changes, show loading until data is fetched
  React.useEffect(() => {
    if (selectedRepo && prevRepoRef.current !== selectedRepo) {
      setIsLoading(true);
      // Simulate loading until pipelineData is updated (or loading is false)
      // If fetchPipeline is async, you may want to await it or listen to loading
      // Here, we watch loading and pipelineData
    }
    prevRepoRef.current = selectedRepo;
  }, [selectedRepo]);

  // When loading is done and pipelineData is present, stop loading
  React.useEffect(() => {
    if (!loading && pipelineData && isLoading) {
      setIsLoading(false);
    }
  }, [loading, pipelineData, isLoading]);

  // Dropdown close logic
  React.useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(e.target as Node) &&
        dropdownTriggerRef.current &&
        !dropdownTriggerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Helper for run status
  const getStatus = (run: WorkflowRun) => {
    if (run.conclusion === "success") return "success";
    if (run.conclusion === "failure") return "failed";
    if (run.status === "in_progress" || run.status === "queued")
      return "running";
    return "pending";
  };

  // Helper for job status (Job type)
  const getJobStatus = (job: {
    conclusion?: string | null;
    status?: string | null;
  }) => {
    if (job.conclusion === "success") return "success";
    if (job.conclusion === "failure") return "failed";
    if (job.status === "in_progress" || job.status === "queued")
      return "running";
    return "pending";
  };

  // Helper for run duration
  const getDuration = (start: string, end: string | null) => {
    if (!start || !end) return "In progress...";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return "-";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  // Compose run history for sidebar
  const runHistory = pipelineData
    ? pipelineData.workflows.flatMap((w) =>
        w.recentRuns.map((r) => ({
          id: r.id,
          label: `Run #${r.runNumber}`,
          status: getStatus(r),
          branch: r.branch,
          triggeredAt: r.triggeredAt,
          workflow: w.name,
        })),
      )
    : [];

  // --- Job graph from workflow YAML ---
  type Job = { name: string; needs: string[] };
  type Edge = { from: string; to: string };
  const [jobGraph, setJobGraph] = useState<{ jobs: Job[]; edges: Edge[] }>({
    jobs: [],
    edges: [],
  });
  useEffect(() => {
    // Find selected workflow
    if (!pipelineData || !pipelineData.workflows) return;
    let workflow = pipelineData.workflows[0];
    if (selectedRunId) {
      // Find workflow for selected run
      for (const wf of pipelineData.workflows) {
        if (wf.recentRuns.some((r) => r.id === selectedRunId)) {
          workflow = wf;
          break;
        }
      }
    }
    let parsed: { jobs: Job[]; edges: Edge[] } = { jobs: [], edges: [] };
    if (workflow && workflow.content) {
      parsed = parseJobsFromYaml(workflow.content);
    }
    // Fallback: if no jobs found, but selected run has jobs, use those
    let selectedRun = null;
    if (pipelineData && pipelineData.workflows) {
      const allRuns = pipelineData.workflows.flatMap((w) => w.recentRuns);
      selectedRun =
        allRuns.find((r) => r.id === selectedRunId) || allRuns[0] || null;
    }
    if (
      parsed.jobs.length === 0 &&
      selectedRun &&
      Array.isArray(selectedRun.jobs) &&
      selectedRun.jobs.length > 0
    ) {
      parsed.jobs = selectedRun.jobs.map((j) => ({ name: j.name, needs: [] }));
      parsed.edges = [];
    }
    setJobGraph(parsed);
  }, [pipelineData, selectedRunId]);

  // Layout jobs horizontally, and set status from selected run if available
  let selectedRun = null;
  if (pipelineData && pipelineData.workflows) {
    const allRuns = pipelineData.workflows.flatMap((w) => w.recentRuns);
    selectedRun =
      allRuns.find((r) => r.id === selectedRunId) || allRuns[0] || null;
  }
  // Map job name to job status from selected run
  const jobStatusMap: { [key: string]: string } = {};
  if (selectedRun && Array.isArray(selectedRun.jobs)) {
    for (const job of selectedRun.jobs) {
      jobStatusMap[job.name] = getJobStatus(job);
    }
  }
  // Only show pending or running jobs in the graph
  const allVizNodes = jobGraph.jobs.map((job, idx) => ({
    left: 60 + idx * 260,
    top: 200,
    name: job.name,
    status: jobStatusMap[job.name] || "pending",
    duration: "",
    meta: "",
    id: job.name,
  }));
  // Filter: only show pending or running jobs
  const vizNodes = allVizNodes.filter(
    (n) => n.status === "pending" || n.status === "running",
  );
  const jobNameToIdx = Object.fromEntries(vizNodes.map((n, i) => [n.name, i]));
  const jobEdges = jobGraph.edges
    .map((edge) => ({
      from: jobNameToIdx[edge.from],
      to: jobNameToIdx[edge.to],
    }))
    .filter(
      (edge) => typeof edge.from === "number" && typeof edge.to === "number",
    );

  // If no repos, show message
  if (repos.length === 0) {
    return (
      <Shell activePage="Run Explorer">
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <h2
            style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}
          >
            No Repositories Found
          </h2>
          <p style={{ fontSize: "14px" }}>
            Please install the GitHub App and add repositories to explore CI/CD
            runs.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell activePage="Run Explorer">
      <div className="explorer-container">
        {/* Left Sidebar (Repo & Run Selection) */}
        <div
          className="explorer-sidebar"
          style={{
            backgroundColor: "var(--bg-dark)",
            padding: "24px",
            borderRight: "1px solid var(--border)",
            zIndex: 30,
          }}
        >
          <h4
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              marginBottom: "16px",
              letterSpacing: "1px",
            }}
          >
            Repository
          </h4>
          {/* Repo Dropdown */}
          <div style={{ position: "relative", marginBottom: "24px" }}>
            <div
              ref={dropdownTriggerRef}
              onClick={() => setDropdownOpen((v) => !v)}
              id="project-dropdown-trigger"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-card)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{selectedRepo || "Select a repository"}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              ref={dropdownMenuRef}
              id="project-dropdown-menu"
              style={{
                display: dropdownOpen ? "block" : "none",
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                overflow: "hidden",
                zIndex: 110,
                color: "var(--text-primary)",
              }}
            >
              {repos.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRepo(r.fullName);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color:
                      r.fullName === selectedRepo
                        ? "var(--accent-cyan)"
                        : "var(--text-primary)",
                    cursor: "pointer",
                    backgroundColor:
                      r.fullName === selectedRepo
                        ? "rgba(6, 182, 212, 0.05)"
                        : "transparent",
                    transition: "all 0.2s ease",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                    borderBottomColor: "var(--border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--glass-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      r.fullName === selectedRepo
                        ? "rgba(6, 182, 212, 0.05)"
                        : "transparent")
                  }
                >
                  {r.fullName}
                </div>
              ))}
            </div>
          </div>
          <h4
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              marginBottom: "16px",
              letterSpacing: "1px",
            }}
          >
            Run History
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {isLoading ? (
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                <span
                  className="loader"
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    border: "3px solid var(--border)",
                    borderTop: "3px solid var(--accent-cyan)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: 8,
                  }}
                />
                Loading runs...
              </div>
            ) : (
              <>
                {runHistory.length === 0 && (
                  <div
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    No runs found
                  </div>
                )}
                {runHistory.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor:
                        run.id === selectedRunId
                          ? "var(--accent-cyan)"
                          : "var(--border)",
                      cursor: "pointer",
                      backgroundColor:
                        run.id === selectedRunId
                          ? "rgba(6, 182, 212, 0.05)"
                          : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {run.label}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color:
                            run.status === "failed"
                              ? "var(--error)"
                              : run.status === "success"
                                ? "var(--success)"
                                : run.status === "pending"
                                  ? "#FFD600"
                                  : "var(--accent-cyan)",
                          fontWeight: 800,
                        }}
                      >
                        {run.status.toUpperCase()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {run.workflow} • {run.branch}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        {/* Detail Area */}
        <div
          className="explorer-content"
          style={{
            backgroundColor: "var(--bg-dark)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              padding: "20px 32px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "var(--bg-card)",
              zIndex: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800 }}>
                {selectedRunId
                  ? runHistory.find((r) => r.id === selectedRunId)?.label
                  : "Visualization"}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {selectedRepo}{" "}
                {selectedRunId && (
                  <>
                    / {runHistory.find((r) => r.id === selectedRunId)?.workflow}
                  </>
                )}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                backgroundColor: "var(--bg-card)",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
              className="desktop-only"
            >
              <Button
                size="sm"
                variant={view === "visualization" ? "primary" : "secondary"}
                onClick={() => setView("visualization")}
              >
                Graph
              </Button>
              <Button
                size="sm"
                variant={view === "logs" ? "primary" : "secondary"}
                onClick={() => setView("logs")}
              >
                Logs
              </Button>
              <Button
                size="sm"
                variant={view === "workflow" ? "primary" : "secondary"}
                onClick={() => setView("workflow")}
              >
                Workflow File
              </Button>
            </div>
            <div className="mobile-only" style={{ display: "none" }}></div>
          </header>
          <div className="graph-view-container">
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-secondary)",
                  fontSize: 18,
                }}
              >
                <span
                  className="loader"
                  style={{
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    border: "4px solid var(--border)",
                    borderTop: "4px solid var(--accent-cyan)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginBottom: 16,
                  }}
                />
                Loading pipeline data...
              </div>
            ) : view === "visualization" ? (
              <div className="pipeline-graph">
                {/* Job connectivity graph from YAML */}
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {jobEdges.map((edge, i) => {
                    if (
                      typeof edge.from !== "number" ||
                      typeof edge.to !== "number" ||
                      edge.from < 0 ||
                      edge.to < 0 ||
                      edge.from >= vizNodes.length ||
                      edge.to >= vizNodes.length
                    ) {
                      return null;
                    }
                    const from = vizNodes[edge.from];
                    const to = vizNodes[edge.to];
                    if (!from || !to) return null;
                    return (
                      <line
                        key={i}
                        x1={from.left + NODE_WIDTH}
                        y1={from.top + NODE_HEIGHT / 2}
                        x2={to.left}
                        y2={to.top + NODE_HEIGHT / 2}
                        stroke="var(--border)"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="6"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="var(--border)" />
                    </marker>
                  </defs>
                </svg>
                {/* Render job nodes */}
                {vizNodes.length > 0 ? (
                  vizNodes.map((node, idx) => (
                    <PipelineNode key={node.id || idx} {...node} />
                  ))
                ) : (
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "16px",
                      padding: "40px",
                    }}
                  >
                    No jobs to visualize for this workflow.
                  </div>
                )}
              </div>
            ) : view === "logs" ? (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  backgroundColor: "var(--bg-card)",
                  padding: "32px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  lineHeight: "1.8",
                  color: "var(--text-primary)",
                  maxWidth: "900px",
                  margin: "0 auto",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "var(--text-secondary)",
                      fontSize: 18,
                    }}
                  >
                    <span
                      className="loader"
                      style={{
                        display: "inline-block",
                        width: 32,
                        height: 32,
                        border: "4px solid var(--border)",
                        borderTop: "4px solid var(--accent-cyan)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginBottom: 16,
                      }}
                    />
                    Loading logs...
                  </div>
                ) : selectedRunId ? (
                  (() => {
                    // Find the run details
                    const run = pipelineData?.workflows
                      .flatMap((w) => w.recentRuns)
                      .find((r) => r.id === selectedRunId);
                    if (!run) return <div>No run details found.</div>;
                    return (
                      <>
                        <div
                          style={{
                            color:
                              run.status === "success"
                                ? "var(--success)"
                                : run.status === "failed"
                                  ? "var(--error)"
                                  : "var(--accent-cyan)",
                            marginBottom: "16px",
                          }}
                        >
                          [STEP: {run.status?.toUpperCase()}]{" "}
                          {run.commitMessage || run.commitSha}
                        </div>
                        <div
                          style={{
                            margin: "16px 0",
                            borderTop: "1px solid var(--border)",
                            paddingTop: "16px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--accent-cyan)",
                              fontWeight: 700,
                            }}
                          >
                            Run Details:
                          </span>
                          <div style={{ marginTop: "12px" }}>
                            <div>
                              <strong>Branch:</strong> {run.branch}
                            </div>
                            <div>
                              <strong>Triggered:</strong> {run.triggeredAt}
                            </div>
                            <div>
                              <strong>Completed:</strong>{" "}
                              {run.completedAt || "In progress..."}
                            </div>
                            <div>
                              <strong>Event:</strong> {run.event}
                            </div>
                            <div>
                              <strong>Commit:</strong> {run.commitSha}
                            </div>
                          </div>
                        </div>
                        {run.jobs && run.jobs.length > 0 && (
                          <div style={{ marginTop: "16px" }}>
                            <strong>Jobs:</strong>
                            {run.jobs.map((job) => (
                              <div
                                key={job.id}
                                style={{
                                  margin: "8px 0",
                                  padding: "8px 12px",
                                  background: "#181f2a",
                                  borderRadius: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    color:
                                      job.conclusion === "success"
                                        ? "var(--success)"
                                        : job.conclusion === "failure"
                                          ? "var(--error)"
                                          : "var(--accent-cyan)",
                                  }}
                                >
                                  {job.name} — {job.conclusion || job.status}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  Started: {job.startedAt || "-"} | Completed:{" "}
                                  {job.completedAt || "-"}
                                </div>
                                {job.logs && (
                                  <details>
                                    <summary>View Logs</summary>
                                    <pre
                                      style={{
                                        background: "#111827",
                                        color: "#fff",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {job.logs}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "16px",
                      padding: "40px",
                    }}
                  >
                    Select a run from the sidebar to view logs and details.
                  </div>
                )}
              </div>
            ) : view === "workflow" ? (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  backgroundColor: "var(--bg-card)",
                  padding: "32px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  lineHeight: "1.8",
                  color: "var(--text-primary)",
                  maxWidth: "900px",
                  margin: "0 auto",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
                  whiteSpace: "pre",
                  overflowX: "auto",
                }}
              >
                {/* Show workflow YAML content */}
                {(() => {
                  if (!pipelineData || !pipelineData.workflows)
                    return <div>No workflow file found.</div>;
                  let workflow = pipelineData.workflows[0];
                  if (selectedRunId) {
                    for (const wf of pipelineData.workflows) {
                      if (wf.recentRuns.some((r) => r.id === selectedRunId)) {
                        workflow = wf;
                        break;
                      }
                    }
                  }
                  if (workflow && workflow.content) {
                    return (
                      <pre
                        style={{
                          background: "#181f2a",
                          color: "#FFD600",
                          padding: 16,
                          borderRadius: 12,
                          fontSize: 13,
                          overflowX: "auto",
                        }}
                      >
                        {workflow.content}
                      </pre>
                    );
                  }
                  return <div>No workflow file found.</div>;
                })()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <style jsx>{`
        .explorer-container {
          display: flex;
          height: calc(100vh - 160px);
          gap: 2px;
          background-color: var(--border);
          margin: -32px;
        }
        .explorer-sidebar {
          width: 280px;
        }
        .explorer-content {
          flex: 1;
        }
        @media (max-width: 768px) {
          .explorer-container {
            flex-direction: column;
            height: auto;
          }
          .explorer-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .explorer-content {
            width: 100%;
            height: 600px;
          }
          .graph-view-container {
            padding: 24px !important;
          }
          .pipeline-graph {
            transform: scale(0.45);
            transform-origin: top left;
            margin-bottom: -440px;
            margin-right: -550px;
          }
        }
        .graph-view-container {
          flex: 1;
          position: relative;
          overflow: auto;
          padding: 100px;
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.03) 1px,
            transparent 0
          );
          background-size: 40px 40px;
          -webkit-overflow-scrolling: touch;
        }
        .pipeline-graph {
          position: relative;
          width: 1000px;
          height: 800px;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Shell>
  );
}
