"use client";

import React, { useState } from "react";
import { Shell } from "../components/ui/Shell";
import { Card } from "../components/ui/Input";

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
  return (
    <Shell activePage="Dashboard">
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "4px" }}>
          System Overview
        </h2>
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
          value="0"
          trend="+0"
          trendPositive={true}
        />
        <StatCard
          label="PIPELINE HEALTH"
          value="0%"
          trend="+0%"
          trendPositive={true}
        />
        <StatCard
          label="BUILD VOLUME"
          value="0"
          trend="+0%"
          trendPositive={true}
        />
        <StatCard
          label="ACTIVE ALERTS"
          value="0"
          trend="-0"
          trendPositive={false}
        />
      </div>

      {/* Main Content Grid */}
      <div className="main-layout">
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Build Reliability Trends */}
          <Card title="Build Reliability Trends (how stable your builds are over time)">
            <div style={{ padding: "20px 0" }}>
              <EmptyChart message="Connect projects to see build reliability trends" />
            </div>
          </Card>

          {/* Optimization Potential */}
          <Card title="Optimization Potential (Gemini AI)">
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
                style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.3 }}
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
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Activity Stream */}
          <Card title="Activity Stream">
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
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Activity from your pipelines will appear here
              </div>
            </div>
          </Card>

          {/* Resource Consumption */}
          <Card title="Resource Consumption (how much system resources are used)">
            <div style={{ padding: "20px 0" }}>
              <EmptyChart message="Resource usage data will be displayed here" />
            </div>
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
    </Shell>
  );
}
