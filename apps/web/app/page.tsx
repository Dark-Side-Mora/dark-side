"use client";

import React, { useState } from "react";
import { Card } from "../components/ui/Input";
import { LineChart } from "../components/ui/LineChart";
import { useMetrics } from "../lib/dashboard/useMetrics";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  trendPositive?: boolean;
}

const StatCard = ({
  label,
  value,
  trend,
  trendPositive = true,
}: StatCardProps) => (
  <Card>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-secondary)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
      <span style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>
        {value}
      </span>
      <span
        style={{
          fontSize: "13px",
          color: trendPositive ? "var(--success)" : "var(--error)",
          fontWeight: 700,
        }}
      >
        {trend}
      </span>
    </div>
  </Card>
);

const EmptyChart = ({ message }: { message: string }) => (
  <div
    style={{
      height: "180px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.02)",
      borderRadius: "12px",
      border: "1px dashed var(--border)",
    }}
  >
    <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ margin: "0 auto 12px", opacity: 0.3 }}
      >
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
        No Data Available
      </div>
      <div style={{ fontSize: "12px", opacity: 0.7 }}>{message}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { metrics, loading, error, refreshMetrics } = useMetrics();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Loading dashboard metrics...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "var(--error)",
            }}
          >
            Error loading dashboard
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <h2 style={{ fontSize: "32px", fontWeight: 800 }}>System Overview</h2>
          <button
            onClick={refreshMetrics}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor =
                  "rgba(6, 182, 212, 0.1)";
                e.currentTarget.style.borderColor = "var(--accent-cyan)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-card)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2-8.83"></path>
            </svg>
            {loading ? "Syncing..." : "Sync"}
          </button>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "15px",
            marginTop: "4px",
          }}
        >
          Real-time health of your software delivery organization (powered by
          AI)
        </p>
      </div>

      {/* Metric Cards */}
      <div
        className="stats-grid"
        style={{ display: "grid", gap: "24px", marginBottom: "40px" }}
      >
        <StatCard
          label="TOTAL PROJECTS"
          value={metrics?.totalProjects.toString() || "0"}
          trend={`+${metrics?.totalProjects || 0}`}
          trendPositive={true}
        />
        <StatCard
          label="PIPELINE HEALTH"
          value={`${metrics?.pipelineHealthPercentage || 0}%`}
          trend={`${metrics?.pipelineHealthPercentage || 0}%`}
          trendPositive={true}
        />
        <StatCard
          label="BUILD VOLUME"
          value={metrics?.buildVolume.toString() || "0"}
          trend={`${metrics?.buildVolume || 0} builds (30d)`}
          trendPositive={true}
        />
        <StatCard
          label="ACTIVE ALERTS"
          value={metrics?.activeAlerts.toString() || "0"}
          trend={
            metrics?.activeAlerts
              ? `${metrics.activeAlerts} failed`
              : "0 failures"
          }
          trendPositive={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="main-layout">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Build Reliability Trends */}
          <Card title="Build Reliability Trends (last 90 days)">
            {metrics?.reliabilityTrend &&
            metrics.reliabilityTrend.length > 0 ? (
              <>
                <LineChart data={metrics.reliabilityTrend} height={320} />
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "8px",
                    paddingBottom: "12px",
                  }}
                >
                  Showing data from the last 90 days •{" "}
                  {metrics.reliabilityTrend.length}{" "}
                  {metrics.reliabilityTrend.length === 1 ? "day" : "days"} with
                  activity
                </div>
              </>
            ) : (
              <EmptyChart message="Connect projects to see build reliability trends" />
            )}
          </Card>

          {/* Optimization Potential */}
          <Card title="Optimization Potential (Gemini AI)">
            {metrics?.optimizationSuggestions &&
            metrics.optimizationSuggestions.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {metrics.optimizationSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      borderRadius: "12px",
                      border: `1px solid ${
                        suggestion.impact === "high"
                          ? "var(--error)"
                          : suggestion.impact === "medium"
                            ? "orange"
                            : "var(--border)"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>
                        {suggestion.type === "security"
                          ? "🔒"
                          : suggestion.type === "performance"
                            ? "⚡"
                            : suggestion.type === "cost"
                              ? "💰"
                              : "✅"}
                      </span>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          flex: 1,
                        }}
                      >
                        {suggestion.title}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            suggestion.impact === "high"
                              ? "rgba(255,0,0,0.1)"
                              : suggestion.impact === "medium"
                                ? "rgba(255,165,0,0.1)"
                                : "rgba(0,255,0,0.1)",
                          color:
                            suggestion.impact === "high"
                              ? "var(--error)"
                              : suggestion.impact === "medium"
                                ? "orange"
                                : "var(--success)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {suggestion.impact}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                      }}
                    >
                      {suggestion.description}
                    </div>
                    {suggestion.estimatedSavings && (
                      <div
                        style={{
                          fontSize: "11px",
                          marginTop: "8px",
                          color: "var(--success)",
                          fontWeight: 600,
                        }}
                      >
                        💡 Potential savings: {suggestion.estimatedSavings}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "16px",
                  padding: "32px",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "16px",
                    opacity: 0.3,
                  }}
                >
                  ✨
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  AI-powered optimization suggestions will appear here once you
                  connect your projects and run pipelines.
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Activity Stream */}
          <Card title="Activity Stream">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                  maxHeight: "350px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
                className="custom-scrollbar"
              >
                {metrics.recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: "16px",
                      borderBottom:
                        index < metrics.recentActivity.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor:
                            activity.type === "security"
                              ? activity.severity === "CRITICAL" ||
                                activity.severity === "HIGH"
                                ? "var(--error)"
                                : "orange"
                              : activity.status === "SUCCESS" ||
                                  activity.status === "success"
                                ? "var(--success)"
                                : activity.status === "FAILURE" ||
                                    activity.status === "failure"
                                  ? "var(--error)"
                                  : "var(--text-secondary)",
                          marginTop: "6px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            marginBottom: "4px",
                          }}
                        >
                          {activity.title}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "6px",
                          }}
                        >
                          {activity.description}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            opacity: 0.7,
                          }}
                        >
                          {new Date(activity.timestamp).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "12px",
                  padding: "40px 20px",
                  border: "1px dashed var(--border)",
                  textAlign: "center",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ margin: "0 auto 12px", opacity: 0.3 }}
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "var(--text-primary)",
                  }}
                >
                  No Activity Yet
                </div>
                <div
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Activity from your pipelines will appear here
                </div>
              </div>
            )}
          </Card>

          {/* Resource Consumption */}
          <Card title="Resource Consumption (how much system resources are used)">
            {metrics?.resourceConsumption &&
            metrics.resourceConsumption.buildTimeByProject.length > 0 ? (
              <div style={{ padding: "20px" }}>
                {/* Summary Stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginBottom: "4px",
                        fontWeight: 600,
                      }}
                    >
                      AVG BUILD TIME
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700 }}>
                      {metrics.resourceConsumption.averageBuildDuration >= 60
                        ? `${Math.round(metrics.resourceConsumption.averageBuildDuration / 60)}m`
                        : `${metrics.resourceConsumption.averageBuildDuration}s`}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginBottom: "4px",
                        fontWeight: 600,
                      }}
                    >
                      TOTAL TIME (90d)
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700 }}>
                      {metrics.resourceConsumption.totalBuildTime >= 3600
                        ? `${Math.round(metrics.resourceConsumption.totalBuildTime / 3600)}h`
                        : metrics.resourceConsumption.totalBuildTime >= 60
                          ? `${Math.round(metrics.resourceConsumption.totalBuildTime / 60)}m`
                          : `${metrics.resourceConsumption.totalBuildTime}s`}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginBottom: "4px",
                        fontWeight: 600,
                      }}
                    >
                      PEAK BUILD
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700 }}>
                      {metrics.resourceConsumption.peakBuildTime >= 60
                        ? `${Math.round(metrics.resourceConsumption.peakBuildTime / 60)}m`
                        : `${metrics.resourceConsumption.peakBuildTime}s`}
                    </div>
                  </div>
                </div>

                {/* Top Projects by Build Time */}
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  TOP PROJECTS BY BUILD TIME
                </div>
                {metrics.resourceConsumption.buildTimeByProject.map(
                  (project, index) => (
                    <div
                      key={project.projectName}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom:
                          index <
                          metrics.resourceConsumption.buildTimeByProject
                            .length -
                            1
                            ? "1px solid var(--border)"
                            : "none",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                          {project.projectName}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          {project.totalBuilds} builds
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color:
                            project.averageDuration > 600
                              ? "var(--error)"
                              : project.averageDuration > 300
                                ? "orange"
                                : "var(--success)",
                        }}
                      >
                        {project.averageDuration >= 60
                          ? `${Math.round(project.averageDuration / 60)}m`
                          : `${project.averageDuration}s`}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div style={{ padding: "20px 0" }}>
                <EmptyChart message="Resource usage data will be displayed here" />
              </div>
            )}
          </Card>
        </div>
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
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
        }
        
        @media (max-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
