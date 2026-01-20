"use client";

import React, { useState } from "react";
import { Shell } from "../components/ui/Shell";
import { Card } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  meaning: string;
}

const StatCard = ({ label, value, trend, meaning }: StatCardProps) => (
  <Card>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div
        style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "8px",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-secondary)",
          cursor: "help",
        }}
        title={meaning}
      >
        ⓘ
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
      <span style={{ fontSize: "32px", fontWeight: 800 }}>{value}</span>
      <span
        style={{
          fontSize: "12px",
          color: trend.startsWith("+") ? "var(--success)" : "var(--error)",
          fontWeight: 700,
        }}
      >
        {trend}
      </span>
    </div>
  </Card>
);

interface SecurityAlertProps {
  severity: string;
  file: string;
  issue: string;
  type: string;
  id: string;
  onAction: (message: string) => void;
}

const SecurityAlert = ({
  severity,
  file,
  issue,
  type,
  id,
  onAction,
}: SecurityAlertProps) => {
  const sevColor =
    severity === "CRITICAL"
      ? "var(--error)"
      : severity === "HIGH"
        ? "#f87171"
        : severity === "MEDIUM"
          ? "var(--warning)"
          : "#60a5fa";

  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "16px",
        backgroundColor: "rgba(255,255,255,0.02)",
        border: `1px solid ${severity === "CRITICAL" ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: sevColor,
                color: "#000",
                fontWeight: 900,
              }}
            >
              {severity}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              ID: {id}
            </span>
          </div>
          <h4
            style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}
          >
            {issue}
          </h4>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--accent-cyan)" }}>{file}</span> • {type}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button size="sm" onClick={() => onAction("Remediating " + id)}>
            Remediate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction("Ignoring " + id)}
          >
            Ignore
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const alerts = [
    {
      severity: "CRITICAL",
      file: "infra/deploy-task.yml:124",
      issue: "Secrets Exposed in Config",
      type: "Secrets",
      id: "SEC-402",
    },
    {
      severity: "HIGH",
      file: "iam/base-role.json:12",
      issue: "Over-privileged IAM Role",
      type: "Access Control",
      id: "VULN-1001",
    },
    {
      severity: "HIGH",
      file: "Dockerfile:1",
      issue: "Vulnerable Base Image (alpine:3.12)",
      type: "Infrastructure",
      id: "VULN-1002",
    },
    {
      severity: "MEDIUM",
      file: "nginx/prod.conf:42",
      issue: "Insecure redirect in Nginx config",
      type: "Configuration",
      id: "VULN-1003",
    },
    {
      severity: "LOW",
      file: "Dockerfile:45",
      issue: "Root user enabled in Docker",
      type: "Best Practice",
      id: "VULN-1004",
    },
  ];

  return (
    <Shell activePage="Dashboard">
      {/* Custom Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            padding: "16px 24px",
            backgroundColor: "var(--accent-cyan)",
            color: "#000",
            borderRadius: "12px",
            fontWeight: 700,
            boxShadow: "0 10px 30px rgba(6, 182, 212, 0.3)",
            zIndex: 9999,
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800 }}>System Overview</h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "15px",
            marginTop: "4px",
          }}
        >
          Real-time health of your software delivery organization.
        </p>
      </div>

      <div
        className="stats-grid"
        style={{ display: "grid", gap: "24px", marginBottom: "32px" }}
      >
        <StatCard
          label="Total Projects"
          value="12"
          trend="+2"
          meaning="Total number of active repositories monitored by CI-Insight."
        />
        <StatCard
          label="Pipeline Health"
          value="92%"
          trend="+1.4%"
          meaning="Overall success rate of all pipeline runs weighted by critical project importance."
        />
        <StatCard
          label="Build Volume"
          value="1.2k"
          trend="+15%"
          meaning="Number of CI/CD jobs executed across all projects in the last 30 days."
        />
        <StatCard
          label="Active Alerts"
          value="5"
          trend="+1"
          meaning="Current number of unresolved security vulnerabilities and build failures."
        />
      </div>

      <style>{`
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .main-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 32px;
        }
        
        @media (max-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="main-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <Card title="Security & Compliance Alerts">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {alerts.map((alert, i) => (
                <SecurityAlert key={i} {...alert} onAction={showToast} />
              ))}
            </div>
          </Card>

          <Card title="Optimization Potential (Gemini AI)">
            <div
              style={{
                backgroundColor: "rgba(6, 182, 212, 0.05)",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(6, 182, 212, 0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: "24px" }}>✨</div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>
                    Global Build Parallelization
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      lineHeight: "1.6",
                    }}
                  >
                    Across your top 5 projects, I&apos;ve identified{" "}
                    <strong>14 minutes</strong> of wasted compute time per
                    deployment cycle. By parallelizing the &apos;build&apos; and
                    &apos;test&apos; stages, you can reduce total cycle time by
                    42%.
                  </p>
                  <div
                    style={{ marginTop: "16px", display: "flex", gap: "12px" }}
                  >
                    <Button
                      size="sm"
                      onClick={() =>
                        showToast("Analyzing parallelization plan...")
                      }
                    >
                      Review Plan
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <Card title="Activity Stream">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {[
                {
                  user: "John Doe",
                  action: "merged pull request",
                  target: "ecommerce-api#42",
                  time: "12m ago",
                },
                {
                  user: "System",
                  action: "triggered production deploy",
                  target: "web-frontend#1040",
                  time: "45m ago",
                },
                {
                  user: "Jane Smith",
                  action: "re-ran failing job",
                  target: "auth-service#841",
                  time: "1h ago",
                },
                {
                  user: "Gemini",
                  action: "suggested fix for",
                  target: "data-pipeline#201",
                  time: "3h ago",
                },
                {
                  user: "John Doe",
                  action: "updated CI secrets",
                  target: "Organization",
                  time: "5h ago",
                },
              ].map((activity, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        activity.user === "Gemini"
                          ? "var(--accent-cyan)"
                          : "var(--text-secondary)",
                      marginTop: "6px",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "13px" }}>
                      <span style={{ fontWeight: 700 }}>{activity.user}</span>{" "}
                      {activity.action}{" "}
                      <span style={{ color: "var(--accent-cyan)" }}>
                        {activity.target}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
                      }}
                    >
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              style={{ width: "100%", marginTop: "20px" }}
              onClick={() => showToast("Loading full history...")}
            >
              View Full History
            </Button>
          </Card>

          <Card title="Pipeline Health Index">
            <div
              style={{
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <svg width="150" height="150">
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="12"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="12"
                  strokeDasharray="408"
                  strokeDashoffset="40"
                  strokeLinecap="round"
                  transform="rotate(-90 75 75)"
                />
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 800 }}>92%</div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Healthy
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                textAlign: "center",
                marginTop: "16px",
                fontStyle: "italic",
              }}
            >
              Weighted calculation of build success, security posture, and
              deployment velocity.
            </p>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </Shell>
  );
}
