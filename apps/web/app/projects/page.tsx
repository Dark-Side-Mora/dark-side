"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";
import { useOrganization } from "../../lib/organization/useOrganization";
import { useProject } from "../../lib/project/useProject";
import { useGithubApp } from "@/lib/project/useGithubApp";
import { useProjectContext } from "@/lib/project/ProjectContext";

export default function ProjectsPage() {
  const router = useRouter();
  const {
    currentOrgId,
    loading: orgLoading,
    fetchOrganizations,
  } = useOrganization();
  const { fetchProjects, loading: projectLoading, projects } = useProject();

  const { installGithubApp, syncInstallations, authorizeGithubApp } =
    useGithubApp();
  const [githubLoading, setGithubLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { setCurrentProjectId, setRepositoryUrl } = useProjectContext();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Detect redirect success from GitHub
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("status") === "success") {
      console.log(
        "[ProjectsPage] GitHub sync success detected, refreshing data...",
      );

      const refreshData = async () => {
        const orgs = await fetchOrganizations();
        // If we have a current org, or if one was just auto-selected by the provider, refresh projects
        if (currentOrgId) {
          await fetchProjects(currentOrgId);
        }
      };

      refreshData().catch(console.error);

      // Remove query params from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchOrganizations, fetchProjects, currentOrgId]);

  const handleConnectClick = async () => {
    setGithubLoading(true);
    try {
      const res = (await installGithubApp(
        window.location.origin + "/projects",
      )) as any;
      if (res.data?.installationUrl) {
        window.location.href = res.data.installationUrl;
      }
    } catch (err) {
      alert("Redirection failed: " + (err as Error).message);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleReconnectClick = async () => {
    setGithubLoading(true);
    try {
      const res = (await authorizeGithubApp(
        window.location.origin + "/projects",
      )) as any;
      if (res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      }
    } catch (err) {
      alert("Reconnection failed: " + (err as Error).message);
    } finally {
      setGithubLoading(false);
    }
  };

  // Background Sync logic
  const performBackgroundSync = async (silent = true) => {
    try {
      if (!silent) setSyncLoading(true);

      await syncInstallations();
      console.log("[ProjectsPage] Sync completed, refreshing data...");

      // Refresh organizations and projects
      await fetchOrganizations();
      if (currentOrgId) {
        await fetchProjects(currentOrgId);
      }

      if (!silent) {
        alert("✅ Installations synced successfully!");
      }
    } catch (err) {
      const message = (err as Error).message;
      if (
        message.includes("expired") ||
        message.includes("Unauthorized") ||
        message.includes("401")
      ) {
        setIsTokenExpired(true);
        if (!silent) {
          alert(
            "⚠️ Connection Invalid: Please click the 'Reconnect GitHub' button appearing now.",
          );
        }
      } else if (!silent) {
        alert("Sync failed: " + message);
      }
    } finally {
      if (!silent) setSyncLoading(false);
    }
  };

  // 1. Instant Response to Organization Switching
  useEffect(() => {
    if (isMounted && currentOrgId) {
      console.log(
        `[ProjectsPage] Org switch detected: ${currentOrgId}. Fetching projects...`,
      );
      fetchProjects(currentOrgId);
    }
  }, [isMounted, currentOrgId, fetchProjects]);

  // 2. Background Sync (Initial mount & Window Focus)
  useEffect(() => {
    if (!isMounted) return;

    // Initial background sync
    performBackgroundSync(true);

    const handleFocus = () => {
      console.log(
        "[ProjectsPage] Window focused, triggering background sync...",
      );
      performBackgroundSync(true);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isMounted]); // Removed currentOrgId from here to prevent redundant heavy syncs

  return (
    <>
      <div
        style={{
          marginBottom: "40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}
          >
            Connected Projects
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Manage and monitor your CI/CD pipelines here.
          </p>
        </div>
        {isMounted && (
          <div style={{ display: "flex", gap: "12px" }}>
            {isTokenExpired && (
              <Button
                onClick={handleReconnectClick}
                disabled={githubLoading}
                style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                }}
              >
                {githubLoading ? "Redirecting..." : "⚠️ Reconnect GitHub"}
              </Button>
            )}
            <Button onClick={handleConnectClick} disabled={githubLoading}>
              {githubLoading ? "Redirecting..." : "Add New Project"}
            </Button>
          </div>
        )}
      </div>

      <div className="projects-grid">
        {!isMounted ? null : !currentOrgId && !orgLoading ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "80px 40px",
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed var(--border)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div style={{ fontSize: "60px" }}>🐙</div>
            <h3 style={{ fontSize: "28px", fontWeight: 700 }}>
              Discover your Projects
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                maxWidth: "550px",
                fontSize: "17px",
                lineHeight: "1.6",
              }}
            >
              To see your workflows, connect CI-Insight to your GitHub account.
              We'll automatically discover your organizations, personal
              workspaces, and repositories.
            </p>
            <Button
              onClick={handleConnectClick}
              disabled={githubLoading}
              style={{ padding: "16px 40px", fontSize: "16px" }}
            >
              {githubLoading ? "Redirecting..." : "Get Started with GitHub"}
            </Button>
          </div>
        ) : orgLoading || (projectLoading && projects.length === 0) ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <span className="text-xl animate-pulse">
                Loading your projects...
              </span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div
            onClick={handleConnectClick}
            style={{
              gridColumn: "1 / -1",
              padding: "60px",
              borderRadius: "16px",
              border: "2px dashed var(--border)",
              textAlign: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                fontSize: "40px",
                display: "block",
                marginBottom: "16px",
              }}
            >
              +
            </span>
            <span style={{ fontWeight: 600 }}>
              {githubLoading
                ? "Redirecting to GitHub..."
                : "No projects found in this organization. Click to add new projects."}
            </span>
          </div>
        ) : (
          <>
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setCurrentProjectId(p.id);
                  setRepositoryUrl(p.repositoryUrl);
                  router.push("/explorer");
                }}
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                <Card
                  style={
                    {
                      height: "100%",
                      border: "1px solid var(--border)",
                      transition: "border-color 0.2s ease, transform 0.2s ease",
                      ":hover": {
                        borderColor: "var(--accent-cyan)",
                        transform: "translateY(-4px)",
                      },
                    } as any
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      {p.provider === "github" ? "🐙" : "📦"}
                    </div>
                    <div
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        color: "var(--success)",
                        textTransform: "uppercase",
                      }}
                    >
                      {p.provider}
                    </div>
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    {p.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginBottom: "20px",
                    }}
                  >
                    {p.repositoryUrl}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      borderTop: "1px solid var(--border)",
                      paddingTop: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Created
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        Pipelines
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>
                        {p.pipelines?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {/* Add Project Card */}
            <div
              onClick={handleConnectClick}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                transition: "all 0.2s ease",
              }}
              className="add-project-card"
            >
              <span style={{ fontSize: "32px", marginBottom: "8px" }}>+</span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                {githubLoading ? "Redirecting..." : "Add New Project"}
              </span>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }
        .add-project-card:hover {
          border-color: var(--accent-cyan);
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.01);
        }
        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
        .projects-grid {
          transition: opacity 0.3s ease;
          opacity: ${projectLoading ? 0.7 : 1};
        }
      `}</style>
    </>
  );
}
