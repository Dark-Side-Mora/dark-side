"use client";

import React, { useEffect, useState } from "react";
import { Shell } from "../../components/ui/Shell";
import { Card } from "../../components/ui/Input";
import { useOrganization } from "../../lib/organization/useOrganization";
import { useProject } from "../../lib/project/useProject";
import { useGithubApp } from "@/lib/project/useGithubApp";
import { time } from "console";

export default function ProjectsPage() {
  const {
    currentOrgId,
    organizations,
    selectOrganization,
    loading: orgLoading,
    fetchOrganizations,
  } = useOrganization();
  const {
    fetchProjects,
    loading: projectLoading,
    createProject,
  } = useProject();
  const { authorizeGithubApp, fetchInstallations } = useGithubApp();
  const [projects, setProjects] = useState<any[]>([]);
  const [showAddProject, setShowAddProject] = useState(false);
  const [githubAuthorized, setGithubAuthorized] = useState<boolean | null>(
    null,
  );
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubMessage, setGithubMessage] = useState("");
  const [installations, setInstallations] = useState<any[]>([]);
  const { checkGithubAppAuthorized } = useGithubApp();
  const [selectedRepos, setSelectedRepos] = useState<{
    [key: number]: Set<string>;
  }>({});

  useEffect(() => {
    if (currentOrgId) {
      fetchProjects(currentOrgId).then(setProjects);
    } else {
      console.log("No current organization selected.");
    }
  }, [currentOrgId]);

  return (
    <Shell activePage="Projects">
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
          Connected Projects
        </h2>
      </div>

      <div className="projects-grid">
        {orgLoading || projectLoading ? (
          <div>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div>No projects found for this organization.</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => (window.location.href = "/explorer")}
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
                      {new Date(p.createdAt).toLocaleString()}
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
          ))
        )}

        {showAddProject ? (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "16px",
              background: "var(--background)",
              padding: "32px",
              margin: "24px 0",
              maxWidth: 600,
              width: "100%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: 16 }}>
              Add New Project (GitHub App)
            </h2>
            {githubAuthorized === null && (
              <div style={{ marginBottom: 12 }}>
                Checking GitHub authorization...
              </div>
            )}
            {githubAuthorized === false && (
              <button
                onClick={async () => {
                  setGithubLoading(true);
                  setGithubMessage("");
                  try {
                    const data = (await authorizeGithubApp(
                      window.location.origin + "/projects",
                    )) as any;
                    if (data.data?.authorizationUrl) {
                      window.location.href = data.data.authorizationUrl;
                    }
                  } catch (error) {
                    setGithubMessage("Error: " + (error as Error).message);
                  } finally {
                    setGithubLoading(false);
                  }
                }}
                disabled={githubLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "var(--accent-cyan)",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  marginBottom: 12,
                  cursor: githubLoading ? "not-allowed" : "pointer",
                }}
              >
                {githubLoading ? "Loading..." : "Install GitHub App"}
              </button>
            )}
            {githubAuthorized === true && (
              <button
                onClick={async () => {
                  setGithubLoading(true);
                  setGithubMessage("");
                  try {
                    const data = (await fetchInstallations()) as any;
                    if (data.data?.installations) {
                      setInstallations(data.data.installations);
                      setGithubMessage(
                        `Found ${data.data.installations.length} installations`,
                      );
                    } else {
                      setGithubMessage(
                        "No GitHub App installations found. Please install the app first.",
                      );
                    }
                  } catch (error) {
                    setGithubMessage("Error: " + (error as Error).message);
                  } finally {
                    setGithubLoading(false);
                  }
                }}
                disabled={githubLoading}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "var(--border)",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  border: "none",
                  marginLeft: 12,
                  marginBottom: 12,
                  cursor: githubLoading ? "not-allowed" : "pointer",
                }}
              >
                Fetch Installations
              </button>
            )}
            {githubMessage && (
              <div
                style={{
                  margin: "12px 0",
                  color: githubMessage.includes("Error")
                    ? "var(--error)"
                    : "var(--success)",
                  fontWeight: 600,
                }}
              >
                {githubMessage}
              </div>
            )}
            {installations.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3
                  style={{ fontSize: "18px", fontWeight: 700, marginBottom: 8 }}
                >
                  Installed on Accounts
                </h3>
                {installations.map((installation) => (
                  <div
                    key={installation.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: 16,
                      marginBottom: 16,
                      background: "rgba(255,255,255,0.01)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 16 }}>
                        {installation.accountLogin}
                      </span>
                      <span
                        style={{
                          marginLeft: 12,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "var(--border)",
                          fontSize: 12,
                        }}
                      >
                        {installation.accountType}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "var(--border)",
                          fontSize: 12,
                        }}
                      >
                        {installation.repositorySelection === "all"
                          ? "All Repos"
                          : "Selected Repos"}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background:
                            installation.status === "active"
                              ? "var(--success-bg)"
                              : "var(--border)",
                          color:
                            installation.status === "active"
                              ? "var(--success)"
                              : "var(--text-secondary)",
                          fontSize: 12,
                        }}
                      >
                        {installation.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: 8,
                      }}
                    >
                      {installation.repositoryCount} repositories
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Connected Repositories:</strong>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {installation.repositories.map((repo: any) => (
                          <li
                            key={repo.id}
                            style={{
                              padding: "2px 0",
                              fontSize: 13,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              style={{ marginRight: 8 }}
                              checked={
                                selectedRepos[installation.id]?.has(
                                  repo.fullName,
                                ) || false
                              }
                              onChange={(e) => {
                                setSelectedRepos((prev) => {
                                  const newSelected = new Set(
                                    prev[installation.id] || [],
                                  );
                                  if (e.target.checked) {
                                    newSelected.add(repo.fullName);
                                  } else {
                                    newSelected.delete(repo.fullName);
                                  }
                                  return {
                                    ...prev,
                                    [installation.id]: newSelected,
                                  };
                                });
                              }}
                            />
                            <span>{repo.fullName}</span>
                            {repo.private && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "var(--border)",
                                  fontSize: 11,
                                }}
                              >
                                Private
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {/* <button
                        onClick={async () => {
                          setGithubLoading(true);
                          setGithubMessage("");
                          try {
                            const data = await syncInstallation(installation.id) as any;
                            setGithubMessage(`✅ Synced ${data.data?.synced} repositories`);
                            // Refresh installations
                            const d = await fetchInstallations() as any;
                            setInstallations(d.data?.installations || []);
                          } catch (error) {
                            setGithubMessage('Error: ' + (error as Error).message);
                          } finally {
                            setGithubLoading(false);
                          }
                        }}
                        style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--accent-cyan)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        disabled={githubLoading}
                      >
                        🔄 Sync Repositories
                      </button> */}
                      <button
                        onClick={() =>
                          window.open(
                            `https://github.com/settings/installations/${installation.installationId}`,
                            "_blank",
                          )
                        }
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: "var(--border)",
                          color: "var(--text-primary)",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                        disabled={githubLoading}
                      >
                        ⚙️ Configure in GitHub
                      </button>
                      <button
                        onClick={async () => {
                          setGithubLoading(true);
                          setGithubMessage("");
                          try {
                            const repoList = installation.repositories.filter(
                              (repo: any) =>
                                selectedRepos[installation.id]?.has(
                                  repo.fullName,
                                ),
                            );
                            for (const repo of repoList) {
                              await createProject(currentOrgId!, {
                                organizationId: currentOrgId!,
                                name: repo.name,
                                provider: "github",
                                repositoryUrl:
                                  repo.htmlUrl || repo.url || repo.fullName,
                                repoData: repo,
                              });
                            }
                            setGithubMessage(
                              `Imported ${repoList.length} project(s)`,
                            );
                            // Optionally refresh projects list
                            fetchProjects(currentOrgId!).then(setProjects);
                          } catch (error) {
                            setGithubMessage(
                              "Error: " + (error as Error).message,
                            );
                          } finally {
                            setGithubLoading(false);
                          }
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: "var(--border)",
                          color: "var(--text-primary)",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                        disabled={githubLoading}
                      >
                        Import to projects
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginTop: 8,
                      }}
                    >
                      Tip: Click "Configure in GitHub" to add/remove
                      repositories
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddProject(false)}
              style={{
                marginTop: 16,
                padding: "8px 18px",
                borderRadius: 8,
                background: "var(--border)",
                color: "var(--text-primary)",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div
            onClick={async () => {
              setShowAddProject(true);
              setGithubAuthorized(null);
              try {
                const result = (await checkGithubAppAuthorized()) as any;
                setGithubAuthorized(result.data?.installations.length > 0);
              } catch {
                setGithubAuthorized(false);
              }
            }}
            style={
              {
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
                ":hover": {
                  borderColor: "var(--accent-cyan)",
                  color: "var(--text-primary)",
                },
              } as any
            }
          >
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>+</span>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              Add New Project
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        div:hover {
          border-color: var(--accent-cyan);
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }
        @media (max-width: 768px) {
          .projects-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Shell>
  );
}
