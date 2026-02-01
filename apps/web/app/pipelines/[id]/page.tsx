"use client";

import React from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Input";

const StatusBadge = ({ status }: { status: string }) => {
  const isSuccess = status === "Success" || status === "completed";
  const isFailed = status === "Failed" || status === "error";
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: isSuccess
          ? "rgba(16, 185, 129, 0.1)"
          : isFailed
            ? "rgba(239, 68, 68, 0.1)"
            : "rgba(139, 92, 246, 0.1)",
        color: isSuccess
          ? "var(--success)"
          : isFailed
            ? "var(--error)"
            : "var(--accent-purple)",
      }}
    >
      {status}
    </span>
  );
};

const Node = ({ name, status, x, y, type = "job" }: any) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: type === "stage" ? "180px" : "140px",
      backgroundColor: "var(--bg-sidebar)",
      border: `1px solid ${status === "success" ? "var(--success)" : status === "failed" ? "var(--error)" : "var(--border)"}`,
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow:
        status === "running" ? "0 0 20px rgba(6, 182, 212, 0.15)" : "none",
      zIndex: 10,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
        }}
      >
        {type}
      </span>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor:
            status === "success"
              ? "var(--success)"
              : status === "failed"
                ? "var(--error)"
                : "var(--accent-cyan)",
        }}
        className={status === "running" ? "animate-pulse" : ""}
      />
    </div>
    <div style={{ fontSize: "14px", fontWeight: 600 }}>{name}</div>
    {status === "success" && (
      <div
        style={{
          fontSize: "11px",
          color: "var(--success)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Passes (1.2s)
      </div>
    )}
  </div>
);

export default function PipelineDetailPage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Button>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
              main-web-prod{" "}
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 400,
                  fontSize: "18px",
                }}
              >
                #451
              </span>
            </h2>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginTop: "4px",
              }}
            >
              <StatusBadge status="Success" />
              <span
                style={{ fontSize: "13px", color: "var(--text-secondary)" }}
              >
                Branch: main • Commit: 7a2d1e • 2 mins ago
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="secondary">Rerun Job</Button>
          <Button>Promote to Prod</Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "32px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card
            title="Workflow Visualization"
            style={{
              height: "500px",
              position: "relative",
              overflow: "hidden",
              cursor: "grab",
            }}
          >
            <div
              style={{
                position: "relative",
                height: "100%",
                width: "100%",
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            >
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                <path
                  d="M140 120 L240 120"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M380 120 C 440 120, 440 60, 500 60"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="4 4"
                />
                <path
                  d="M380 120 C 440 120, 440 180, 500 180"
                  stroke="var(--success)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M640 180 C 700 180, 700 120, 760 120"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>

              <Node
                name="Checkout Source"
                status="success"
                x={20}
                y={80}
                type="stage"
              />
              <Node name="Linting" status="success" x={240} y={80} />
              <Node name="Unit Tests" status="running" x={500} y={20} />
              <Node name="Security Scan" status="success" x={500} y={140} />
              <Node
                name="Staging Deployment"
                status="pending"
                x={760}
                y={80}
                type="stage"
              />
            </div>
          </Card>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "24px",
            }}
          >
            <Card title="Build Duration">
              <div style={{ fontSize: "24px", fontWeight: 700 }}>4m 32s</div>
              <div style={{ fontSize: "12px", color: "var(--success)" }}>
                Within normal range
              </div>
            </Card>
            <Card title="Resources">
              <div style={{ fontSize: "24px", fontWeight: 700 }}>
                2 CPUs / 4GB
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Standard Runner
              </div>
            </Card>
            <Card title="Artifacts">
              <div style={{ fontSize: "24px", fontWeight: 700 }}>124 MB</div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--accent-cyan)",
                  cursor: "pointer",
                }}
              >
                View all files →
              </div>
            </Card>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card title="AI Diagnostic (Gemini)">
            <div
              style={{
                backgroundColor: "rgba(6, 182, 212, 0.05)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "var(--text-primary)",
                }}
              >
                Comparing this run (#451) with previous successful builds. I
                noticed a 15% increase in 'npm install' time. Consider enabling{" "}
                <strong>dependency caching</strong> to save approximately 45s
                per build.
              </p>
            </div>
            <Button variant="secondary" style={{ width: "100%" }}>
              Show Optimization Strategy
            </Button>
          </Card>

          <Card title="Security Summary">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px" }}>Vulnerabilities</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>
                  None
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px" }}>Secret Leakage</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>
                  Pass
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px" }}>Compliance</span>
                <span style={{ color: "var(--warning)", fontWeight: 600 }}>
                  Minor Audit
                </span>
              </div>
            </div>
          </Card>

          <Card title="Environment Variables">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              <div
                style={{
                  padding: "6px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                }}
              >
                NODE_ENV: production
              </div>
              <div
                style={{
                  padding: "6px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                }}
              >
                API_ENDPOINT: https://api.prd...
              </div>
              <div
                style={{
                  padding: "6px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                }}
              >
                LOG_LEVEL: info
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
