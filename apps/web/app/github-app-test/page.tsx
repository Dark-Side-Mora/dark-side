"use client";

import { useState, useEffect } from "react";
import styles from "../github-test/github-test.module.css";

const API_URL = "http://localhost:3000";

interface Installation {
  id: string;
  installationId: string;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
  repositoryCount: number;
  status: string;
  installedAt: string;
  repositories: Repository[];
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
}

export default function GitHubAppTestPage() {
  const [userId, setUserId] = useState("test-user-123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [installations, setInstallations] = useState<Installation[]>([]);

  // Handle installation callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      setMessage(
        '✅ GitHub App installed successfully! Click "Fetch Installations" to see your repositories.',
      );
      window.history.replaceState({}, "", "/github-app-test");
    } else if (status === "error") {
      setMessage("❌ GitHub App installation failed: " + params.get("message"));
      window.history.replaceState({}, "", "/github-app-test");
    }
  }, []);

  const handleInstallApp = async () => {
    setLoading(true);
    setMessage("");

    try {
      // First authorize to get user access token, which will fetch installations
      const response = await fetch(
        `${API_URL}/integrations/github-app/authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            redirectUri: window.location.origin + "/github-app-test",
          }),
        },
      );

      const data = await response.json();

      if (data.data?.authorizationUrl) {
        // Redirect to GitHub App authorization (this will also show installation prompt if not installed)
        window.location.href = data.data.authorizationUrl;
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchInstallations = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/integrations/github-app/installations?userId=${userId}`,
      );
      const data = await response.json();

      if (data.data?.installations) {
        setInstallations(data.data.installations);
        setMessage(`Found ${data.data.installations.length} installations`);
      } else {
        setMessage(
          "No GitHub App installations found. Please install the app first.",
        );
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncInstallation = async (installationId: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/integrations/github-app/installations/${installationId}/sync`,
        {
          method: "POST",
        },
      );
      const data = await response.json();
      setMessage(`✅ Synced ${data.data.synced} repositories`);

      // Refresh installations
      await handleFetchInstallations();
    } catch (error) {
      setMessage("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconfigureInstallation = (installationId: string) => {
    // Redirect to GitHub settings page to reconfigure repositories
    window.open(
      `https://github.com/settings/installations/${installationId}`,
      "_blank",
    );
  };

  return (
    <div className={styles.container}>
      <h1>GitHub App Integration Test</h1>
      <p className={styles.description}>
        <strong>GitHub App</strong> provides repository-level access control.
        You can see and manage connected repositories directly in GitHub
        Settings.
      </p>

      <div className={styles.infoBox}>
        <h3>💡 How to Modify Repository Access:</h3>
        <ol>
          <li>
            Click <strong>"Configure in GitHub"</strong> button below
          </li>
          <li>
            Or go to{" "}
            <a
              href="https://github.com/settings/installations"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Settings → Installations
            </a>
          </li>
          <li>Modify repository selection</li>
          <li>
            Click <strong>"Sync Installation"</strong> to update in app
          </li>
        </ol>
      </div>

      <div className={styles.section}>
        <h2>1. Install GitHub App</h2>
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
          onClick={handleInstallApp}
          disabled={loading || !userId}
          className={styles.button}
        >
          {loading ? "Loading..." : "Install GitHub App"}
        </button>
        <p className={styles.hint}>
          This will redirect you to GitHub where you can select which
          repositories to grant access.
        </p>
      </div>

      <div className={styles.section}>
        <h2>2. View Installed Repositories</h2>
        <button
          onClick={handleFetchInstallations}
          disabled={loading || !userId}
          className={styles.button}
        >
          Fetch Installations
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

      {installations.length > 0 && (
        <div className={styles.section}>
          <h2>Installed on Accounts</h2>
          <div className={styles.orgList}>
            {installations.map((installation) => (
              <div key={installation.id} className={styles.installationCard}>
                <h3>{installation.accountLogin}</h3>
                <div className={styles.installationMeta}>
                  <span className={styles.badge}>
                    {installation.accountType}
                  </span>
                  <span className={styles.badge}>
                    {installation.repositorySelection === "all"
                      ? "All Repos"
                      : "Selected Repos"}
                  </span>
                  <span
                    className={`${styles.badge} ${installation.status === "active" ? styles.badgeSuccess : ""}`}
                  >
                    {installation.status}
                  </span>
                </div>
                <p>{installation.repositoryCount} repositories</p>

                <div className={styles.repoSection}>
                  <h4>Connected Repositories:</h4>
                  <div className={styles.repoList}>
                    {installation.repositories.map((repo) => (
                      <div key={repo.id} className={styles.repoItemDisplay}>
                        <span>
                          {repo.fullName}
                          {repo.private && (
                            <span className={styles.badge}>Private</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => handleSyncInstallation(installation.id)}
                    className={styles.smallButton}
                    disabled={loading}
                  >
                    🔄 Sync Repositories
                  </button>
                  <button
                    onClick={() =>
                      handleReconfigureInstallation(installation.installationId)
                    }
                    className={styles.secondaryButton}
                    disabled={loading}
                  >
                    ⚙️ Configure in GitHub
                  </button>
                </div>

                <p className={styles.hint}>
                  Tip: Click "Configure in GitHub" to add/remove repositories,
                  then "Sync" to update here.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
