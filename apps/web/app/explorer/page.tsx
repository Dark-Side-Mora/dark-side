"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAnalyzeLogs } from "@/lib/project/useAi";
import { usePipeline } from "@/lib/project/usePipeline";
import { fetchWorkflowGraph } from "@/lib/project/useWorkflowGraph";
import { useProjectContext } from "@/lib/project/ProjectContext";
import { useOrganizationContext } from "@/lib/organization/OrganizationContext";
import type { WorkflowRun } from "@/lib/project/usePipeline";

// --- Professional Node Component with Fixed Dimensions for Alignment ---
const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;

const STEP_NODE_WIDTH = 220;
const STEP_NODE_HEIGHT = 90;

const PipelineNode = ({
  name,
  status,
  duration,
  meta,
  top,
  left,
  isExpanded,
  onToggle,
  stepCount,
}: any) => {
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
      onClick={onToggle}
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${NODE_WIDTH}px`,
        minHeight: `${NODE_HEIGHT}px`,
        padding: "20px",
        borderRadius: "20px",
        backgroundColor: "var(--bg-card)",
        backdropFilter: "blur(10px)",
        border: `2px solid ${isRunning ? "var(--accent-cyan)" : isFailed ? "rgba(239, 68, 68, 0.4)" : "var(--border)"}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "8px",
        zIndex: 10,
        opacity: isPending ? 0.4 : 1,
        boxShadow: isRunning
          ? "0 0 25px rgba(6, 182, 212, 0.15)"
          : isExpanded
            ? "0 8px 30px rgba(0,0,0,0.3)"
            : "none",
        transition: "all 0.3s ease",
        cursor: "pointer",
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
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
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
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "4px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "8px",
          }}
        >
          {meta}
        </div>
        {stepCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--accent-cyan)",
              fontWeight: 600,
              paddingTop: "8px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <span>
              {stepCount} step{stepCount !== 1 ? "s" : ""}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Steps List Component (displayed when job is expanded) ---
const StepsList = ({ steps, jobName, top, left }: any) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${NODE_WIDTH}px`,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "12px",
        zIndex: 9,
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        Steps ({steps.length})
      </div>
      {steps.map((step: any, idx: number) => {
        const isPending = step.status === "pending";
        const isHealthy = step.status === "success";
        const isFailed = step.status === "failed";
        const isRunning = step.status === "running";

        const color = isHealthy
          ? "var(--success)"
          : isFailed
            ? "var(--error)"
            : isRunning
              ? "var(--accent-cyan)"
              : "#999";

        return (
          <div
            key={step.id}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.02)",
              marginBottom: "8px",
              border: "1px solid rgba(255,255,255,0.05)",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  minWidth: "20px",
                }}
              >
                {idx + 1}.
              </span>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: color,
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  flex: 1,
                }}
              >
                {step.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function RunExplorerPage() {
  // --- State for API Data ---
  const {
    repositoryUrl,
    setRepositoryUrl,
    setCurrentProjectId,
    projects,
    projectCache,
  } = useProjectContext();
  const { setCurrentOrgId } = useOrganizationContext();
  const { pipelineData, loading, error, fetchPipeline } = usePipeline();
  const [view, setView] = useState("visualization");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { analysisData, analysisLoading, fetchAnalysis } = useAnalyzeLogs();

  // Track previous repo to trigger loading
  const prevRepoRef = useRef<string | null>(null);

  // When repositoryUrl changes, show loading until data is fetched
  React.useEffect(() => {
    if (repositoryUrl && prevRepoRef.current !== repositoryUrl) {
      setIsLoading(true);
    }
    prevRepoRef.current = repositoryUrl;
  }, [repositoryUrl]);

  // Sync with ProjectContext
  useEffect(() => {
    if (repositoryUrl) {
      // Find the project matching this repo URL to get its provider
      const project = projects.find((p) => p.repositoryUrl === repositoryUrl);
      if (project) {
        fetchPipeline(repositoryUrl, project.provider);
      }
    }
  }, [repositoryUrl, projects, fetchPipeline]);

  // Update context when dropdown changes
  const handleRepoChange = (project: any) => {
    setSelectedRunId(null);
    setRepositoryUrl(project.repositoryUrl);
    setCurrentProjectId(project.id);
    setCurrentOrgId(project.organizationId);
    fetchPipeline(project.repositoryUrl, project.provider);
  };

  // When loading is done, stop local loading
  React.useEffect(() => {
    if (!loading && isLoading) {
      setIsLoading(false);
    }
  }, [loading, isLoading]);

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
          workflowId: w.id,
          label: `Run #${r.runNumber}`,
          status: getStatus(r),
          branch: r.branch,
          triggeredAt: r.triggeredAt,
          workflow: w.name,
        })),
      )
    : [];

  // --- Job graph from API data ---
  type Job = { name: string; needs: string[]; steps: any[] };
  type Step = { id: string; name: string; jobName: string };
  type Edge = { from: string; to: string; type?: "job" | "step-sequence" };
  const [jobGraph, setJobGraph] = useState<{
    jobs: Job[];
    steps: Step[];
    edges: Edge[];
  }>({
    jobs: [],
    steps: [],
    edges: [],
  });

  // --- Fetch workflow graph from API for selected run ---
  const [apiGraphData, setApiGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Toggle job expansion
  const toggleJobExpansion = (jobName: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobName)) {
      newExpanded.delete(jobName);
    } else {
      newExpanded.add(jobName);
    }
    setExpandedJobs(newExpanded);
  };

  useEffect(() => {
    if (!selectedRunId || !repositoryUrl) {
      setJobGraph({ jobs: [], steps: [], edges: [] });
      setApiGraphData(null);
      setExpandedJobs(new Set()); // Reset expanded jobs
      return;
    }

    // Fetch the workflow graph from API
    const loadGraphData = async () => {
      setGraphLoading(true);
      setExpandedJobs(new Set()); // Reset expanded jobs when loading new run
      try {
        const project = projects.find((p) => p.repositoryUrl === repositoryUrl);
        const provider = project?.provider || "github";

        const graphData = await fetchWorkflowGraph(
          repositoryUrl,
          selectedRunId as number,
          provider,
        );

        // Handle both wrapped and unwrapped responses
        let actualGraph: any = graphData;
        if (graphData && typeof graphData === "object" && "jobs" in graphData) {
          actualGraph = graphData;
        } else if (
          graphData &&
          typeof graphData === "object" &&
          "graph" in graphData
        ) {
          const wrappedGraph = (graphData as any).graph;
          if (
            wrappedGraph &&
            typeof wrappedGraph === "object" &&
            "jobs" in wrappedGraph
          ) {
            actualGraph = wrappedGraph;
          }
        }

        if (actualGraph && "jobs" in actualGraph && actualGraph.jobs) {
          setApiGraphData({ graph: actualGraph });
          console.log("[Explorer] Received graph data:", actualGraph);

          // Transform API data to our local format
          const jobs = Object.entries(actualGraph.jobs).map(
            ([jobName, jobNode]: any) => {
              const steps = (jobNode.steps || []).map(
                (step: any, idx: number) => ({
                  id: `${jobName}-step-${idx}`,
                  name: step.name || `Step ${idx + 1}`,
                  jobName,
                }),
              );

              return {
                name: jobName,
                needs: jobNode.dependencies || [],
                steps,
              };
            },
          );

          console.log("[Explorer] Transformed jobs:", jobs);

          // Build edges from the graph data
          const edges: any[] = [];

          // Add job dependency edges
          Object.entries(actualGraph.jobs).forEach(
            ([jobName, jobNode]: any) => {
              (jobNode.dependencies || []).forEach((depJob: string) => {
                edges.push({
                  from: depJob,
                  to: jobName,
                  type: "job",
                });
              });

              // Add step sequence edges within this job
              const steps = jobNode.steps || [];
              for (let i = 0; i < steps.length - 1; i++) {
                edges.push({
                  from: `${jobName}-step-${i}`,
                  to: `${jobName}-step-${i + 1}`,
                  type: "step-sequence",
                });
              }
            },
          );

          console.log("[Explorer] Built edges:", edges);

          setJobGraph({ jobs, steps: [], edges });
        } else {
          console.error("[Explorer] No graph data in response:", graphData);
          setJobGraph({ jobs: [], steps: [], edges: [] });
        }
      } catch (error) {
        console.error("Failed to fetch workflow graph:", error);
        setJobGraph({ jobs: [], steps: [], edges: [] });
      } finally {
        setGraphLoading(false);
      }
    };

    loadGraphData();
  }, [selectedRunId, repositoryUrl, projects]);

  // Layout jobs horizontally, and set status from selected run if available
  const selectedRun = React.useMemo(() => {
    if (!pipelineData?.workflows) return null;
    const allRuns = pipelineData.workflows.flatMap((w) => w.recentRuns);
    return allRuns.find((r) => r.id === selectedRunId) || allRuns[0] || null;
  }, [pipelineData, selectedRunId]);

  // Map job name to job status and timing from API graph data OR selected run fallback
  const jobDataMap = React.useMemo(() => {
    const map: {
      [key: string]: { status: string; duration: string; startedAt?: string };
    } = {};

    // First try to use API graph data if available
    if (apiGraphData) {
      const graphObj = apiGraphData.graph || apiGraphData;
      if (graphObj && graphObj.jobs) {
        Object.entries(graphObj.jobs).forEach(([jobName, jobNode]: any) => {
          map[jobName] = {
            status: getJobStatus(jobNode),
            duration: getDuration(
              jobNode.startedAt || "",
              jobNode.completedAt || null,
            ),
            startedAt: jobNode.startedAt || undefined,
          };
        });
      }
    }

    // Fallback to selected run data if available
    if (selectedRun?.jobs && Array.isArray(selectedRun.jobs)) {
      for (const job of selectedRun.jobs) {
        if (!map[job.name]) {
          map[job.name] = {
            status: getJobStatus(job),
            duration: getDuration(job.startedAt || "", job.completedAt || null),
            startedAt: job.startedAt || undefined,
          };
        }
      }
    }

    return map;
  }, [apiGraphData, selectedRun]);

  // Create nodes for jobs and steps with proper layout - memoized to update when data changes
  const { vizNodes, nodeIndexMap, maxHeight } = React.useMemo(() => {
    const allVizNodes: any[] = [];
    const nodeMap: { [key: string]: { index: number; isStep: boolean } } = {};
    let calculatedMaxHeight = 600;

    // Calculate layout: jobs are 300px apart horizontally
    jobGraph.jobs.forEach((job, jobIdx) => {
      const jobNodeId = job.name;
      const jobLeft = 60 + jobIdx * 300;
      const jobTop = 150;
      const jobData = jobDataMap[job.name];
      const isExpanded = expandedJobs.has(job.name);

      allVizNodes.push({
        id: jobNodeId,
        isJob: true,
        left: jobLeft,
        top: jobTop,
        name: job.name,
        status: jobData?.status || "pending",
        duration: jobData?.duration || "-",
        meta: jobData?.startedAt
          ? new Date(jobData.startedAt).toLocaleTimeString()
          : "",
        isExpanded,
        stepCount: job.steps?.length || 0,
        steps: job.steps || [],
      });
      nodeMap[jobNodeId] = { index: allVizNodes.length - 1, isStep: false };

      // If job is expanded, add steps list component
      if (isExpanded && job.steps && job.steps.length > 0) {
        const stepsListTop = jobTop + NODE_HEIGHT + 16;
        const stepsListHeight = Math.min(job.steps.length * 52 + 60, 400);

        allVizNodes.push({
          id: `${jobNodeId}-steps-list`,
          isStepsList: true,
          left: jobLeft,
          top: stepsListTop,
          steps: job.steps.map((step: any, idx: number) => ({
            ...step,
            status: "pending", // Default status, can be enhanced with real data
          })),
          jobName: job.name,
        });

        // Update max height if this job's expanded view extends further
        const bottomY = stepsListTop + stepsListHeight;
        if (bottomY > calculatedMaxHeight) {
          calculatedMaxHeight = bottomY + 100;
        }
      }
    });

    const indexMap: { [key: string]: number } = {};
    allVizNodes.forEach((n, i) => {
      indexMap[n.id] = i;
    });

    return {
      vizNodes: allVizNodes,
      nodeIndexMap: indexMap,
      maxHeight: calculatedMaxHeight,
    };
  }, [jobGraph, jobDataMap, expandedJobs]);

  // Build edges - memoized to avoid recalculating on every render
  const jobEdges = React.useMemo(() => {
    return jobGraph.edges
      .map((edge) => ({
        from: nodeIndexMap[edge.from],
        to: nodeIndexMap[edge.to],
        type: edge.type || "job",
      }))
      .filter(
        (edge) =>
          typeof edge.from === "number" &&
          typeof edge.to === "number" &&
          edge.from >= 0 &&
          edge.to >= 0,
      );
  }, [jobGraph.edges, nodeIndexMap]);

  // If no projects, show message
  if (projects.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
          No Projects Found
        </h2>
        <p style={{ fontSize: "14px" }}>
          Please add some projects to explore CI/CD runs.
        </p>
      </div>
    );
  }

  return (
    <>
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
              <span>{repositoryUrl || "Select a repository"}</span>
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
              {projects.map((p, idx) => (
                <div
                  key={`${p.id}-${idx}`}
                  onClick={() => {
                    handleRepoChange(p);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color:
                      p.repositoryUrl === repositoryUrl
                        ? "var(--accent-cyan)"
                        : "var(--text-primary)",
                    cursor: "pointer",
                    backgroundColor:
                      p.repositoryUrl === repositoryUrl
                        ? "rgba(6, 182, 212, 0.05)"
                        : "transparent",
                    transition: "all 0.2s ease",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{p.provider === "github" ? "🐙" : "📦"}</span>
                    <span>{p.repositoryUrl}</span>
                  </div>
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
                {runHistory.length === 0 && !isLoading && !loading && (
                  <div
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    No runs found
                  </div>
                )}
                {runHistory.map((run) => (
                  <div
                    key={`${run.workflowId}-${run.id}`}
                    onClick={() => setSelectedRunId(run.id as any)}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border:
                        run.id === selectedRunId
                          ? "1px solid var(--accent-cyan)"
                          : "1px solid var(--border)",
                      cursor: "pointer",
                      backgroundColor:
                        run.id === selectedRunId
                          ? "rgba(6, 182, 212, 0.05)"
                          : "transparent",
                      position: "relative",
                    }}
                  >
                    {run.id === selectedRunId && graphLoading && (
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                        }}
                      >
                        <span
                          className="loader"
                          style={{
                            display: "inline-block",
                            width: 14,
                            height: 14,
                            border: "2px solid var(--border)",
                            borderTop: "2px solid var(--accent-cyan)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      </div>
                    )}
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
            {error && (
              <div style={{ color: "var(--error)", fontSize: "12px" }}>
                {error}
              </div>
            )}
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800 }}>
                {selectedRunId
                  ? runHistory.find((r) => r.id === selectedRunId)?.label
                  : "Pipeline Explorer"}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {repositoryUrl}{" "}
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
            ) : error ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--error)",
                  fontSize: 16,
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: "16px", fontSize: "40px" }}>⚠️</div>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                  Failed to Load Pipeline
                </div>
                <div style={{ color: "var(--text-secondary)" }}>{error}</div>
                {error.includes("Resource not accessible") && (
                  <div
                    style={{
                      marginTop: "16px",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    This usually means the GitHub App lacks{" "}
                    <b>Actions: Read-only</b> permissions.
                    <br />
                    Please update the app permissions in GitHub Settings.
                  </div>
                )}
              </div>
            ) : view === "visualization" ? (
              graphLoading ? (
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
                  Loading workflow graph...
                </div>
              ) : (
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

                      const fromWidth = from.isStep
                        ? STEP_NODE_WIDTH
                        : NODE_WIDTH;
                      const toWidth = to.isStep ? STEP_NODE_WIDTH : NODE_WIDTH;
                      const fromHeight = from.isStep
                        ? STEP_NODE_HEIGHT
                        : NODE_HEIGHT;
                      const toHeight = to.isStep
                        ? STEP_NODE_HEIGHT
                        : NODE_HEIGHT;

                      const isStepSequence = edge.type === "step-sequence";
                      const strokeDash = isStepSequence ? "5,5" : "0";

                      return (
                        <line
                          key={i}
                          x1={from.left + fromWidth}
                          y1={from.top + fromHeight / 2}
                          x2={to.left}
                          y2={to.top + toHeight / 2}
                          stroke={
                            isStepSequence
                              ? "rgba(100, 150, 200, 0.4)"
                              : "var(--border)"
                          }
                          strokeWidth={isStepSequence ? "1.5" : "2"}
                          strokeDasharray={strokeDash}
                          markerEnd={
                            isStepSequence
                              ? "url(#arrowhead-step)"
                              : "url(#arrowhead)"
                          }
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
                      <marker
                        id="arrowhead-step"
                        markerWidth="8"
                        markerHeight="6"
                        refX="8"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <polygon
                          points="0 0, 8 3, 0 6"
                          fill="rgba(100, 150, 200, 0.4)"
                        />
                      </marker>
                    </defs>
                  </svg>
                  {/* Render job and step nodes */}
                  {vizNodes.length > 0 ? (
                    vizNodes.map((node, idx) =>
                      node.isStepsList ? (
                        <StepsList key={node.id || idx} {...node} />
                      ) : node.isJob ? (
                        <PipelineNode
                          key={node.id || idx}
                          {...node}
                          onToggle={() => toggleJobExpansion(node.name)}
                        />
                      ) : null,
                    )
                  ) : !isLoading && !loading ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--text-secondary)",
                        fontSize: "16px",
                        padding: "40px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "48px",
                          marginBottom: "16px",
                          opacity: 0.5,
                        }}
                      >
                        📊
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "8px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {!selectedRunId ? "No Run Selected" : "No Jobs Found"}
                      </div>
                      <div>
                        {!selectedRunId
                          ? "Select a workflow run from the sidebar to visualize the pipeline graph"
                          : "No jobs to visualize for this workflow"}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
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
                      ?.flatMap((w) => w.recentRuns)
                      .find((r) => r.id === selectedRunId);

                    if (!run) {
                      if (isLoading || loading) return null;
                      return <div>No run details found.</div>;
                    }
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            [STEP: {run.status?.toUpperCase()}]{" "}
                            {run.commitMessage || run.commitSha}
                          </span>
                          <button
                            onClick={() => {
                              const run = pipelineData?.workflows
                                ?.flatMap((w) => w.recentRuns)
                                .find((r) => r.id === selectedRunId);
                              const workflow = pipelineData?.workflows?.find(
                                (w) =>
                                  w.recentRuns.some(
                                    (r) => r.id === selectedRunId,
                                  ),
                              );
                              if (run && workflow) {
                                const allLogs =
                                  run.jobs
                                    ?.map((j) => `[${j.name}]\n${j.logs || ""}`)
                                    .join("\n\n") || "";
                                fetchAnalysis(allLogs, workflow.content || "");
                              }
                            }}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: "var(--accent-cyan)",
                              color: "#000",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "opacity 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = "0.8")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = "1")
                            }
                          >
                            {analysisLoading ? "Analyzing..." : "Analyze"}
                          </button>
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
                        {analysisData && (
                          <div
                            style={{
                              marginTop: "24px",
                              paddingTop: "24px",
                              borderTop: "1px solid var(--border)",
                              backgroundColor: "rgba(6, 182, 212, 0.05)",
                              padding: "16px",
                              borderRadius: "8px",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--accent-cyan)",
                                fontWeight: 700,
                                marginBottom: "12px",
                              }}
                            >
                              Analysis Results:
                            </div>
                            {analysisLoading ? (
                              <div style={{ color: "var(--text-secondary)" }}>
                                Analyzing...
                              </div>
                            ) : analysisData.error ? (
                              <div style={{ color: "var(--error)" }}>
                                {analysisData.error}
                              </div>
                            ) : (
                              <>
                                <div style={{ marginBottom: "12px" }}>
                                  <strong>Summary:</strong>
                                  <div
                                    style={{
                                      color: "var(--text-secondary)",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {analysisData.summary}
                                  </div>
                                </div>
                                {analysisData.reasons && (
                                  <div style={{ marginBottom: "12px" }}>
                                    <strong>Reasons for Fails:</strong>
                                    <div
                                      style={{
                                        color: "var(--text-secondary)",
                                        marginTop: "4px",
                                      }}
                                    >
                                      {analysisData.reasons}
                                    </div>
                                  </div>
                                )}
                                {analysisData.suggestedFixes && (
                                  <div>
                                    <strong>Suggested Fixes:</strong>
                                    <div
                                      style={{
                                        color: "var(--text-secondary)",
                                        marginTop: "4px",
                                      }}
                                    >
                                      {analysisData.suggestedFixes}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
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
                  if (isLoading || loading) {
                    return (
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
                        Loading workflow file...
                      </div>
                    );
                  }

                  if (
                    !pipelineData ||
                    !pipelineData.workflows ||
                    pipelineData.workflows.length === 0
                  )
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
                  return (
                    <div>No workflow details found for this selection.</div>
                  );
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
            transform: scale(0.35);
            transform-origin: top left;
            margin-bottom: -640px;
            margin-right: -650px;
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
          min-height: 800px;
          height: auto;
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
    </>
  );
}
