"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";

type PipelineSummary = {
  id: string;
  name: string;
  fullName: string;
  provider: string;
  branch: string;
  status: string;
  duration: string;
  lastRun: string;
};

const PipelinesPage = () => {
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [installations, setInstallations] = useState([]);
  const [pipelineSummaries, setPipelineSummaries] = useState<PipelineSummary[]>(
    [],
  );
  const [userId, setUserId] = useState("134e5e07-b313-4702-b1f7-5e207c43f3ca");
  // Extract projectId from query string (e.g., /pipelines?projectId=xxx)
  let projectId = "15d28b95-766b-4dd0-b11a-0c2fea768cff";
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    const queryProjectId = searchParams.get("projectId");
    if (queryProjectId) {
      projectId = queryProjectId;
    }
  }

  const API_URL = "http://localhost:3000";

  // Fetch installations and pipeline summaries for all repos
  const fetchPipelineSummaries = async () => {
    setLoading(true);
    setMessage("");
    try {
      const summaries = [];
      const resp = await fetch(
        `${API_URL}/pipelines/github/${projectId}/data?userId=${userId}&limit=1`,
      );
      const pdata = await resp.json();
      if (pdata.data) {
        summaries.push({
          id: String(projectId) || "",
          name: "test repo",
          fullName: "repo.fullName",
          provider: "GitHub",
          branch: pdata.data.workflows?.[0]?.recentRuns?.[0]?.branch || "",
          status: pdata.data.summary?.latestRunStatus || "N/A",
          duration: pdata.data.workflows?.[0]?.recentRuns?.[0]?.duration || "",
          lastRun:
            pdata.data.workflows?.[0]?.recentRuns?.[0]?.triggeredAt || "",
        });
      }

      setPipelineSummaries(summaries);
      setMessage(`Loaded ${summaries.length} pipelines`);
    } catch (error) {
      setMessage(
        "Error: " + (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}
          >
            Pipelines
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Monitor and manage connected software delivery workflows.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "14px",
              minWidth: 120,
            }}
          />
          <Button
            variant="secondary"
            onClick={fetchPipelineSummaries}
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch Pipelines"}
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        {["All", "Active", "Failed", "Recent"].map((tag) => (
          <Button
            key={tag}
            variant={filter === tag ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>

      {message && (
        <div
          style={{
            marginBottom: 16,
            color: message.startsWith("Error")
              ? "var(--error)"
              : "var(--success)",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        {pipelineSummaries.map((p) => (
          <Card
            key={p.id}
            glass={false}
            style={{ padding: "0", overflow: "hidden" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto auto auto",
                alignItems: "center",
                gap: "40px",
                padding: "24px 32px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="2"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <div>
                <a
                  href={`/pipelines/${p.id}`}
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                    textDecoration: "none",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {p.name}
                </a>
                <div
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  {p.provider} •{" "}
                  <span
                    style={{
                      color: "var(--accent-cyan)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {p.branch}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </div>
                <span
                  style={{
                    color:
                      p.status === "success"
                        ? "var(--success)"
                        : p.status === "failed"
                          ? "var(--error)"
                          : "var(--accent-cyan)",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {p.status}
                </span>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Duration
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>
                  {p.duration}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Last Ran
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>
                  {p.lastRun}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => (window.location.href = `/pipelines/${p.id}`)}
                >
                  Analyze
                </Button>
                <Button variant="secondary" size="sm">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h.01" />
                    <path d="M12 12h.01" />
                    <path d="M12 4h.01" />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default PipelinesPage;
