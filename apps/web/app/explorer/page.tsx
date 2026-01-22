"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shell } from "../../components/ui/Shell";
import { Card } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useProject } from "@/lib/project/useProject";

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
        : "var(--text-secondary)";

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

// --- Precision SVG Connector ---
const Connectors = () => {
  const getY = (top: number) => top + NODE_HEIGHT / 2;
  const getXMid = (left: number) => left + NODE_WIDTH / 2;
  const getXRight = (left: number) => left + NODE_WIDTH;

  // Positions matching the improved layout
  const s1_left = 40;
  const s2_left = 380;
  const s3_left = 720;

  const hub1_x = 320;
  const hub2_x = 670;

  return (
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
      {/* 1. Connection Stage 1: Initialize -> Checkout */}
      <line
        x1={getXMid(s1_left)}
        y1={80 + NODE_HEIGHT}
        x2={getXMid(s1_left)}
        y2={300}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle
        cx={getXMid(s1_left)}
        cy={190 + NODE_HEIGHT / 2}
        r="3"
        fill="var(--accent-cyan)"
      />

      {/* 2. Stage 1 (Checkout Output) -> Stage 2 Bus */}
      {/* Output from Checkout Node (Bottom Left) to Hub */}
      <line
        x1={getXRight(s1_left)}
        y1={getY(300)}
        x2={hub1_x}
        y2={getY(300)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />

      {/* Vertical Bus Bar distributing to all Stage 2 inputs */}
      <line
        x1={hub1_x}
        y1={getY(80)}
        x2={hub1_x}
        y2={getY(380)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />

      {/* Branches to S2 nodes (Unit Test, ESLint, Snyk) */}
      <line
        x1={hub1_x}
        y1={getY(80)}
        x2={s2_left}
        y2={getY(80)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={s2_left} cy={getY(80)} r="3" fill="var(--accent-cyan)" />

      <line
        x1={hub1_x}
        y1={getY(230)}
        x2={s2_left}
        y2={getY(230)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={s2_left} cy={getY(230)} r="3" fill="var(--accent-cyan)" />

      <line
        x1={hub1_x}
        y1={getY(380)}
        x2={s2_left}
        y2={getY(380)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={s2_left} cy={getY(380)} r="3" fill="var(--accent-cyan)" />

      {/* 3. Stage 2 -> Stage 3 Bus */}
      <path
        d={`M ${getXRight(s2_left)} ${getY(80)} L ${hub2_x} ${getY(80)} L ${hub2_x} ${getY(430)}`}
        stroke="var(--border)"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1={getXRight(s2_left)}
        y1={getY(230)}
        x2={hub2_x}
        y2={getY(230)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <line
        x1={getXRight(s2_left)}
        y1={getY(380)}
        x2={hub2_x}
        y2={getY(380)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />

      {/* Branches to S3 nodes */}
      <line
        x1={hub2_x}
        y1={getY(230)}
        x2={s3_left}
        y2={getY(230)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={s3_left} cy={getY(230)} r="3" fill="var(--accent-cyan)" />

      <line
        x1={hub2_x}
        y1={getY(430)}
        x2={s3_left}
        y2={getY(430)}
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle cx={s3_left} cy={getY(430)} r="3" fill="var(--accent-cyan)" />

      {/* Animated Streak on Active Path */}
      <circle r="2.5" fill="var(--accent-cyan)">
        <animateMotion
          path={`M ${getXRight(s2_left)} ${getY(230)} L ${s3_left} ${getY(230)}`}
          dur="2.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default function RunExplorerPage() {
  const { projects, projectId, setCurrentProjectId } = useProject();
  const [selectedProject, setSelectedProject] = useState(() =>
    projects.find((p) => p.id === projectId),
  );

  // Keep selectedProject in sync with async project loading
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const found = projects.find((p) => p.id === projectId);
      if (found) setSelectedProject(found);
    }
  }, [projects, projectId]);
  const [selectedRun, setSelectedRun] = useState("Build #1042");
  const [view, setView] = useState("visualization");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
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

  if (projects.length === 0) {
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
            No Projects Found
          </h2>
          <p style={{ fontSize: "14px" }}>
            Please create or select a project to explore CI/CD runs.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell activePage="Run Explorer">
      <div className="explorer-container">
        {/* Left Sidebar (Run Selection) */}
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
            Project Context
          </h4>

          {/* Custom Dark Dropdown */}
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
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{selectedProject?.name}</span>
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
              {projects.map((p) => (
                <div
                  key={p.id ?? p.repositoryUrl}
                  onClick={() => {
                    setSelectedProject(p);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    color:
                      p.id === selectedProject?.id
                        ? "var(--accent-cyan)"
                        : "var(--text-primary)",
                    cursor: "pointer",
                    backgroundColor:
                      p.id === selectedProject?.id
                        ? "rgba(6, 182, 212, 0.05)"
                        : "transparent",
                    transition: "all 0.2s ease",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--glass-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      p.id === selectedProject?.id
                        ? "rgba(6, 182, 212, 0.05)"
                        : "transparent")
                  }
                >
                  {p.name}
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
            {["Build #1042", "Build #1041", "Build #1040", "Build #1039"].map(
              (run, i) => (
                <div
                  key={run}
                  onClick={() => setSelectedRun(run)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor:
                      run === selectedRun
                        ? "var(--accent-cyan)"
                        : "var(--border)",
                    cursor: "pointer",
                    backgroundColor:
                      run === selectedRun
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
                      {run}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: i === 1 ? "var(--error)" : "var(--success)",
                        fontWeight: 800,
                      }}
                    >
                      {i === 1 ? "FAILED" : "SUCCESS"}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                  >
                    main • {i === 0 ? "2m ago" : i === 1 ? "1h ago" : "5h ago"}
                  </div>
                </div>
              ),
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
                {selectedRun}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {selectedProject?.name} / workflow: main.yml / branch: main
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
            </div>
            {/* Mobile View Toggle */}
            <div className="mobile-only" style={{ display: "none" }}>
              {/* Can add simplified toggle here if needed, but styling handles layout */}
            </div>
          </header>

          <div className="graph-view-container">
            {view === "visualization" ? (
              <div className="pipeline-graph">
                <Connectors />

                {/* Stage 1 */}
                <PipelineNode
                  left={40}
                  top={80}
                  name="Initialize Pipeline"
                  status="success"
                  duration="2s"
                  meta="ubuntu-latest"
                />
                <PipelineNode
                  left={40}
                  top={300}
                  name="Checkout Source"
                  status="success"
                  duration="8s"
                  meta="git-fetch"
                />

                {/* Stage 2 */}
                <PipelineNode
                  left={380}
                  top={80}
                  name="Unit Test Suite"
                  status="success"
                  duration="1m 12s"
                  meta="jest • 842 passed"
                />
                <PipelineNode
                  left={380}
                  top={230}
                  name="ESLint Analysis"
                  status="success"
                  duration="24s"
                  meta="0 warnings"
                />
                <PipelineNode
                  left={380}
                  top={380}
                  name="Snyk SCA Security"
                  status="failed"
                  duration="45s"
                  meta="1 critical vulnerability"
                />

                {/* Stage 3 */}
                <PipelineNode
                  left={720}
                  top={230}
                  name="Production Build"
                  status="running"
                  duration="In progress..."
                  meta="next build"
                />
                <PipelineNode
                  left={720}
                  top={430}
                  name="Vercel Deployment"
                  status="pending"
                  duration="Waiting..."
                  meta="env: prod"
                />
              </div>
            ) : (
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
                <div
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                  }}
                >
                  # Standard output from runner node-1b...
                </div>
                <div style={{ color: "var(--success)" }}>
                  [STEP: Initialize] Ready.
                </div>
                <div style={{ color: "var(--success)" }}>
                  [STEP: Checkout] Repository cloned at /home/runner/work.
                </div>
                <div
                  style={{
                    margin: "16px 0",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "16px",
                  }}
                >
                  <span
                    style={{ color: "var(--accent-cyan)", fontWeight: 700 }}
                  >
                    CI-Insight Intelligence Report:
                  </span>
                  <div
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "4px solid var(--error)",
                      padding: "16px",
                      marginTop: "12px",
                      borderRadius: "0 8px 8px 0",
                    }}
                  >
                    <span style={{ color: "var(--error)", fontWeight: 800 }}>
                      SECURITY VULNERABILITY FOUND
                    </span>
                    <br />
                    ID: CVE-2023-45133 (High Severity)
                    <br />
                    Package: undici 5.x
                    <br />
                    Recommendation: Run `npm update undici` to resolve before
                    production deployment.
                  </div>
                </div>
              </div>
            )}
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
            height: 600px; /* Fixed height for scrollable graph area on mobile */
          }
          .graph-view-container {
            padding: 24px !important;
            /* On mobile, we want to center the scaled graph if possible or just let it stay top-left */
          }
          .pipeline-graph {
            transform: scale(0.45);
            transform-origin: top left;
            margin-bottom: -440px; /* Compress the vertical empty space left by scaling */
            margin-right: -550px; /* Compress horizontal */
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
      `}</style>
    </Shell>
  );
}
