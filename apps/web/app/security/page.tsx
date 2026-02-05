"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";
import { useAiSecurity } from "../../lib/project/useAi";
import { useProjectContext } from "../../lib/project/ProjectContext";
import { useAuthContext } from "../../lib/auth/auth-context";

// Simple spinner component
const Spinner = () => (
  <div
    style={{
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTopColor: "#fff",
      animation: "spin 1s ease-in-out infinite",
    }}
  >
    <style jsx>{`
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

// Map severity to color
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "var(--error)";
    case "high":
      return "#F97316"; // Orange
    case "medium":
      return "#EAB308"; // Yellow
    case "low":
      return "#3B82F6"; // Blue
    default:
      return "var(--text-secondary)";
  }
};

export default function SecurityPage() {
  const { projectId } = useProjectContext();
  const { user, isLoading: authLoading } = useAuthContext();
  const [userId, setUserId] = useState<string>("");

  const {
    installations,
    securityAnalysis,
    loading,
    message,
    fetchInstallations,
    fetchSecurityAnalysis,
  } = useAiSecurity(userId);

  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSolution, setExpandedSolution] = useState<number | null>(null);

  // Placeholder for repository selection logic
  const [selectedRepo, setSelectedRepo] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTriggerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  // Update userId when user is authenticated
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user?.id]);

  // Fetch installations when userId is available
  useEffect(() => {
    if (userId) {
      fetchInstallations();
    }
  }, [userId, fetchInstallations]);

  // Flatten all repos for dropdown
  const repos: any[] = installations.flatMap(
    (inst: any) => inst.repositories || [],
  );

  // Close dropdown on outside click
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

  // Handler for scan button
  const handleAnalyzeSecurity = async () => {
    if (selectedRepo) {
      setAnalyzing(true);
      await fetchSecurityAnalysis(selectedRepo);
      setAnalyzing(false);
    }
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

  // Show loading state while auth is being checked
  if (authLoading || (userId === "" && !user)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>
          Please sign in to access the Security Analyzer.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
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
              disabled={loading || analyzing || !selectedRepo}
            >
              {loading || analyzing ? "Scanning..." : "Scan Repository"}
            </Button>
          </div>

          {/* Repo Dropdown */}
          {repos.length > 0 && (
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
                      (e.currentTarget.style.backgroundColor =
                        "var(--glass-bg)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        r.fullName === selectedRepo
                          ? "rgba(6, 182, 212, 0.05)"
                          : "transparent")
                    }
                  >
                    {r.fullName} {r.private ? "🔒" : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {message && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderLeft: "4px solid var(--error)",
                borderRadius: "6px",
                color: "var(--error)",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}

          {/* No repos message */}
          {!loading && repos.length === 0 && !message && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                backgroundColor: "rgba(100, 116, 139, 0.1)",
                borderLeft: "4px solid var(--text-secondary)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              No repositories found. Install the GitHub App on your repositories
              to get started.
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
                  {/* Solution details */}
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
          {/* Security Scoreboard */}
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

          {/* AI Suggestions */}
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
      <p>Security dashboard content coming soon...</p>
    </div>
  );
}
