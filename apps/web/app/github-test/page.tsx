"use client";

import { useState, useEffect } from "react";
import styles from "./github-test.module.css";
import { useGithubApp } from "@/lib/project/useGithubApp";

const API_URL = "http://localhost:3000";

interface Organization {
  id: string;
  name: string;
  repositoryCount: number;
  lastSynced: string;
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
}

export default function GitHubTestPage() {
  const [userId, setUserId] = useState("test-user-123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { authorizeGithubApp } = useGithubApp();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      setMessage(
        '✅ GitHub connected successfully! Click "Fetch Connections" to see your organizations.',
      );
      window.history.replaceState({}, "", "/github-test");
    } else if (status === "error") {
      setMessage("❌ GitHub connection failed: " + params.get("message"));
      window.history.replaceState({}, "", "/github-test");
    }
  }, []);

  const handleConnectGitHub = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = (await authorizeGithubApp(
        `${window.location.origin}/github-test`,
      )) as any;

      if (data.data?.authorizationUrl) {
        // Redirect to GitHub OAuth
        window.location.href = data.data.authorizationUrl;
      } else {
        setMessage("Error: No authorization URL returned");
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchConnections = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/integrations/github/connections?userId=${userId}`,
      );
      const data = await response.json();

      if (data.data?.organizations) {
        setOrganizations(data.data.organizations);
        setMessage(
          `Found ${data.data.organizations.length} connected organizations`,
        );
      } else {
        setMessage("No GitHub connection found. Please connect first.");
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRepositories = async (orgName: string) => {
    setLoading(true);
    setMessage("");
    setSelectedOrg(orgName);

    try {
      const response = await fetch(
        `${API_URL}/integrations/github/organizations/${orgName}/repositories?userId=${userId}&orgName=${orgName}`,
      );
      const data = await response.json();

      if (data.data?.repositories) {
        setRepositories(data.data.repositories);
        setMessage(
          `Found ${data.data.repositories.length} repositories in ${orgName}`,
        );
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRepositories = async () => {
    if (!selectedOrg || selectedRepos.length === 0) {
      setMessage("Please select an organization and at least one repository");
      return;
    }

    setLoading(true);
    setMessage("");

    const orgData = organizations.find((o) => o.name === selectedOrg);
    if (!orgData) return;

    const reposToUpdate = repositories
      .filter((r) => selectedRepos.includes(r.id))
      .map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
      }));

    try {
      const response = await fetch(
        `${API_URL}/integrations/github/repositories`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            organizationId: orgData.id,
            repositories: reposToUpdate,
          }),
        },
      );

      const data = await response.json();
      setMessage(
        `Successfully updated ${reposToUpdate.length} repositories for ${selectedOrg}`,
      );

      // Refresh connections
      await handleFetchConnections();
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRepoSelection = (repoId: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId],
    );
  };

  return (
    <div className={styles.container}>
      <h1>GitHub Integration Test</h1>

      <div className={styles.section}>
        <h2>1. Connect GitHub</h2>
        <div className={styles.inputGroup}>
          <label>User ID (for testing):</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="test-user-123"
            className={styles.input}
          />
        </div>
        <button
          onClick={handleConnectGitHub}
          disabled={loading || !userId}
          className={styles.button}
        >
          {loading ? "Loading..." : "Connect GitHub"}
        </button>
      </div>

      <div className={styles.section}>
        <h2>2. Fetch Connected Organizations</h2>
        <button
          onClick={handleFetchConnections}
          disabled={loading || !userId}
          className={styles.button}
        >
          Fetch Connections
        </button>
      </div>

      {message && (
        <div
          className={
            message.includes("Error") || message.includes("❌")
              ? styles.error
              : styles.success
          }
        >
          {message}
        </div>
      )}

      {organizations.length > 0 && (
        <div className={styles.section}>
          <h2>Connected Organizations</h2>
          <div className={styles.orgList}>
            {organizations.map((org) => (
              <div key={org.id} className={styles.orgCard}>
                <h3>{org.name}</h3>
                <p>Configured Repos: {org.repositoryCount}</p>
                <p>Last Synced: {new Date(org.lastSynced).toLocaleString()}</p>
                <button
                  onClick={() => handleFetchRepositories(org.name)}
                  className={styles.smallButton}
                >
                  View Repositories
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {repositories.length > 0 && (
        <div className={styles.section}>
          <h2>Repositories in {selectedOrg}</h2>
          <p>Select repositories to allow:</p>
          <div className={styles.repoList}>
            {repositories.map((repo) => (
              <label key={repo.id} className={styles.repoItem}>
                <input
                  type="checkbox"
                  checked={selectedRepos.includes(repo.id)}
                  onChange={() => toggleRepoSelection(repo.id)}
                />
                <span>
                  {repo.fullName}
                  {repo.private && (
                    <span className={styles.badge}>Private</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleUpdateRepositories}
            disabled={loading || selectedRepos.length === 0}
            className={styles.button}
          >
            Update Repository Permissions ({selectedRepos.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
