"use client";

import { useEffect, useState } from "react";
import { Shell } from "../../components/ui/Shell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";
import { useAiSecurity } from "../../lib/project/useAi";

export default function SecurityPage() {
  const [userId] = useState("test-user-123");
  const [selectedRepo, setSelectedRepo] = useState("");
  const {
    installations,
    securityAnalysis,
    loading,
    message,
    fetchInstallations,
    fetchSecurityAnalysis,
    setSecurityAnalysis,
    setMessage,
  } = useAiSecurity(userId);

  // Fetch installations on mount
  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  // Handler for scan button
  const handleAnalyzeSecurity = () => {
    if (selectedRepo) fetchSecurityAnalysis(selectedRepo);
  };

  // Helper for color
  type RiskLevel = "critical" | "high" | "medium" | "low" | string;

  interface Repository {
    id: string | number;
    fullName: string;
    private?: boolean;
    [key: string]: any;
  }

  interface Installation {
    id: string | number;
    repositories: Repository[];
    [key: string]: any;
  }

  interface SecurityIssue {
    title: string;
    severity: RiskLevel;
    location?: string;
    category?: string;
    suggestedFix?: string;
    recommendation?: string;
  }

  interface SecurityAnalysis {
    issues?: SecurityIssue[];
    overallRisk?: RiskLevel;
    summary?: string;
  }

  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case "critical":
        return "var(--error)";
      case "high":
        return "var(--warning)";
      case "medium":
        return "#FFD600";
      case "low":
        return "var(--success)";
      default:
        return "var(--accent-purple)";
    }
  };

  const [expandedSolution, setExpandedSolution] = useState<number | null>(null);

  return (
    <Shell activePage="Security">
      <div className="security-grid">
        <style jsx>{`
          .security-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 32px;
          }
          .finding-row {
            display: flex;
            align-items: center;
            padding: 20px 24px;
            gap: 24px;
          }
          .finding-actions {
            display: flex;
            gap: 12px;
          }
          @media (max-width: 1024px) {
            .security-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            .finding-row {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
            .finding-actions {
              width: 100%;
              justify-content: flex-end;
            }
          }
        `}</style>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "8px",
                }}
              >
                Security Analyzer
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Automated configuration auditing and vulnerability management.
              </p>
            </div>
            <Button
              onClick={handleAnalyzeSecurity}
              disabled={loading || !selectedRepo}
            >
              {loading ? "Scanning..." : "Scan Repository"}
            </Button>
          </div>

          {/* Repo selection */}
          {installations.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  minWidth: 220,
                }}
              >
                <option value="">-- Select a repository --</option>
                {installations.map((inst: Installation) =>
                  inst.repositories.map((repo: Repository) => (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.fullName} {repo.private ? "🔒" : ""}
                    </option>
                  )),
                )}
              </select>
            </div>
          )}

          {/* Findings from AI */}
          {securityAnalysis && securityAnalysis.issues && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {securityAnalysis.issues.map((f: SecurityIssue, i: number) => (
                <Card
                  key={i}
                  glass={false}
                  style={{ padding: "0", overflow: "hidden" }}
                >
                  <div className="finding-row">
                    <div
                      style={{
                        width: "4px",
                        height: "40px",
                        backgroundColor: getRiskColor(f.severity),
                        borderRadius: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                          gap: "12px",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {f.title}
                        </h4>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-secondary)",
                            flexShrink: 0,
                          }}
                        >
                          ID: VULN-{1000 + i}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: getRiskColor(f.severity),
                          }}
                        >
                          {f.severity?.toUpperCase()}
                        </span>
                        {f.location && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {f.location}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          •
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {f.category}
                        </span>
                      </div>
                    </div>
                    <div className="finding-actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setExpandedSolution(expandedSolution === i ? null : i)
                        }
                      >
                        {expandedSolution === i ? "Hide Solution" : "Remediate"}
                      </Button>
                      {/* Ignore button hidden for now */}
                    </div>
                  </div>
                  {/* Solution details, toggled by Remediate */}
                  {expandedSolution === i && (
                    <div
                      style={{
                        background: "#181f2a",
                        color: "#FFD600",
                        padding: "16px",
                        borderRadius: "0 0 12px 12px",
                        fontSize: 13,
                        margin: "0 24px 16px 24px",
                      }}
                    >
                      <strong>Solution:</strong>
                      <div style={{ marginTop: 8 }}>
                        {f.suggestedFix ? (
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              color: "#FFD600",
                              background: "none",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            {f.suggestedFix}
                          </pre>
                        ) : f.recommendation ? (
                          <span>{f.recommendation}</span>
                        ) : (
                          <span>No solution provided by AI.</span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Security Scoreboard - dynamic from AI */}
          <Card title="Security Scoreboard">
            <div
              style={{
                position: "relative",
                width: "180px",
                height: "180px",
                margin: "0 auto 24px",
              }}
            >
              <svg width="180" height="180" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="10"
                />
                {/* Score ring color by risk */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    securityAnalysis
                      ? getRiskColor(securityAnalysis.overallRisk)
                      : "var(--error)"
                  }
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={
                    securityAnalysis && securityAnalysis.issues
                      ? 282.7 - securityAnalysis.issues.length * 20
                      : 70
                  }
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: 800 }}>
                  {securityAnalysis
                    ? securityAnalysis.overallRisk?.toUpperCase()
                    : "N/A"}
                </div>
                <div
                  style={{ fontSize: "11px", color: "var(--text-secondary)" }}
                >
                  Risk
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Critical Issues
                </span>
                <span style={{ fontWeight: 600, color: "var(--error)" }}>
                  {securityAnalysis
                    ? securityAnalysis.issues?.filter(
                        (i: SecurityIssue) => i.severity === "critical",
                      ).length
                    : 0}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  High Priority
                </span>
                <span style={{ fontWeight: 600, color: "var(--warning)" }}>
                  {securityAnalysis
                    ? securityAnalysis.issues?.filter(
                        (i: SecurityIssue) => i.severity === "high",
                      ).length
                    : 0}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  Total Issues
                </span>
                <span
                  style={{ fontWeight: 600, color: "var(--accent-purple)" }}
                >
                  {securityAnalysis ? securityAnalysis.issues?.length : 0}
                </span>
              </div>
            </div>
          </Card>

          {/* AI Suggestions - dynamic from AI */}
          <Card title="Suggested Actions (AI)">
            <p
              style={{
                fontSize: "13px",
                lineHeight: "1.6",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              {securityAnalysis && securityAnalysis.summary
                ? securityAnalysis.summary
                : "No suggestions available. Run a scan to get AI recommendations."}
            </p>
            {/* <Button variant="secondary" style={{ width: '100%' }} disabled={!securityAnalysis || !securityAnalysis.issues || securityAnalysis.issues.length === 0}>View Patch Strategy</Button> */}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
