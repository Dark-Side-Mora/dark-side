"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";

export default function LogsPage() {
  const [selectedRun, setSelectedRun] = useState("Build #1042");

  const runs = [
    {
      id: "1042",
      status: "Success",
      time: "2 mins ago",
      name: "Build #1042",
      project: "ecommerce-api",
    },
    {
      id: "1041",
      status: "Failed",
      time: "12 mins ago",
      name: "Build #1041",
      project: "auth-service",
    },
    {
      id: "1040",
      status: "Success",
      time: "45 mins ago",
      name: "Build #1040",
      project: "billing-engine",
    },
    {
      id: "1039",
      status: "Success",
      time: "1 hour ago",
      name: "Build #1039",
      project: "web-front",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: "32px",
        height: "calc(100vh - 160px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
          Execution History
        </h3>
        {runs.map((run) => (
          <div
            key={run.id}
            onClick={() => setSelectedRun(run.name)}
            className={selectedRun === run.name ? "glass" : ""}
            style={{
              padding: "16px",
              borderRadius: "12px",
              cursor: "pointer",
              border:
                selectedRun === run.name
                  ? "1px solid var(--glass-border)"
                  : "1px solid transparent",
              transition: "all 0.2s ease",
              backgroundColor:
                selectedRun === run.name
                  ? "rgba(255,255,255,0.03)"
                  : "transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                {run.name}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color:
                    run.status === "Success"
                      ? "var(--success)"
                      : "var(--error)",
                  textTransform: "uppercase",
                }}
              >
                {run.status}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              <span>{run.project}</span>
              <span>{run.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
              {selectedRun} Out
            </h2>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Logs retrieved from OpenSearch Index: ci-logs-2024.10
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button variant="secondary" size="sm">
              Download Artifacts
            </Button>
            <Button size="sm">Search Logs</Button>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            backgroundColor: "#0a0a0a",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            padding: "24px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            lineHeight: "1.6",
            color: "#d1d5db",
            overflowY: "auto",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "100% 24px",
          }}
        >
          <div style={{ color: "#6b7280", marginBottom: "8px" }}>
            # [Runner-1] Spawning virtual environment for job: {selectedRun}
          </div>
          <div style={{ color: "var(--success)", marginBottom: "4px" }}>
            ✓ [Setup] Successfully cloned repository (depth: 1)
          </div>
          <div style={{ marginBottom: "4px" }}>
            $ npm ci --prefer-offline --no-audit
          </div>
          <div style={{ color: "#9ca3af", marginBottom: "4px" }}>
            added 842 packages in 12.5s
          </div>
          <div style={{ marginBottom: "4px" }}>
            $ npm run test -- --watchAll=false
          </div>
          <div style={{ marginBottom: "4px" }}>&gt; jest --coverage</div>
          <div style={{ marginBottom: "4px" }}>
            <span style={{ color: "var(--accent-cyan)" }}>PASS</span>{" "}
            src/auth/login.test.ts (2.4s)
          </div>
          <div style={{ marginBottom: "4px" }}>
            <span style={{ color: "var(--accent-cyan)" }}>PASS</span>{" "}
            src/infrastructure/messaging.test.ts (0.8s)
          </div>
          <div
            style={{
              color: "var(--success)",
              fontWeight: 600,
              margin: "8px 0",
            }}
          >
            Test Suites: 2 passed, 2 total
          </div>
          <div style={{ marginBottom: "4px" }}>$ npm run build</div>
          <div style={{ color: "var(--warning)", marginBottom: "4px" }}>
            warn - Large chunk detected: main-2e4a1.js (2.4 MB)
          </div>

          <div
            style={{
              color: "#fff",
              backgroundColor: "rgba(6, 182, 212, 0.05)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              padding: "16px",
              borderRadius: "12px",
              margin: "20px 0",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--accent-cyan)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Gemini Intelligent Diagnostic
            </div>
            <p style={{ lineHeight: "1.6" }}>
              Detected a <strong>performance regression</strong> in the build
              stage. Common cause: Unoptimized static assets in{" "}
              <code>/public/assets</code>. Recommendation: Enable image
              optimization in <code>next.config.js</code> to reduce bundle size
              by ~40%.
            </p>
          </div>

          <div style={{ color: "var(--success)", marginBottom: "4px" }}>
            ✓ [Build] Compiled successfully in 45.2s
          </div>
          <div style={{ color: "var(--success)", marginBottom: "4px" }}>
            ✓ [Deploy] Promoted to canary environment
          </div>
          <div style={{ color: "#6b7280", marginTop: "12px" }}>
            # [Runner-1] Cleaning up workspace... DONE.
          </div>
        </div>
      </div>
    </div>
  );
}
