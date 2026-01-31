"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";
import { useGithubApp } from "@/lib/project/useGithubApp";
import { useJenkins } from "@/lib/project/useJenkins";
import { useOrganization } from "@/lib/organization/useOrganization";

const LogoGitHub = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LogoJenkins = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const LogoGitLab = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.06 3.25a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.73-6.88a.74.74 0 0 0 .27-.83Z" />
  </svg>
);

const LogoBitbucket = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z" />
    <path d="M12 4v16" />
    <path d="M4 12h16" />
  </svg>
);

export default function IntegrationsPage() {
  const { installGithubApp, fetchInstallations } = useGithubApp();
  const { organizations } = useOrganization();
  const { getSetup } = useJenkins();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [jenkinsSetup, setJenkinsSetup] = useState<{
    token: string;
    endpoint: string;
  } | null>(null);
  const [showJenkinsModal, setShowJenkinsModal] = useState(false);

  useEffect(() => {
    const checkGitHub = async () => {
      try {
        const res = (await fetchInstallations()) as any;
        if (res.data && res.data.length > 0) {
          setIsGithubConnected(true);
        }
      } catch (err) {
        console.error("Failed to check GitHub installations", err);
      }
    };
    checkGitHub();
  }, [fetchInstallations]);

  const handleConnectGitHub = async () => {
    setLoadingProvider("github");
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
      setLoadingProvider(null);
    }
  };

  const handleConnectJenkins = async () => {
    setLoadingProvider("jenkins");
    try {
      const res = (await getSetup()) as any;
      if (res) {
        setJenkinsSetup(res);
        setShowJenkinsModal(true);
      }
    } catch (err) {
      alert("Failed to get Jenkins setup: " + (err as Error).message);
    } finally {
      setLoadingProvider(null);
    }
  };

  const providers = [
    {
      id: "github",
      name: "GitHub",
      description:
        "Seamlessly connect repositories and automate GitHub Action workflows.",
      logo: <LogoGitHub />,
      connected: isGithubConnected,
      action: handleConnectGitHub,
      color: "#2ea44f",
    },
    {
      id: "jenkins",
      name: "Jenkins",
      description:
        "Connect your local or private Jenkins servers via push-based build tokens.",
      logo: <LogoJenkins />,
      connected: !!jenkinsSetup,
      action: handleConnectJenkins,
      color: "#d24939",
    },
    {
      id: "gitlab",
      name: "GitLab",
      description:
        "Monitor GitLab CI/CD pipelines and security scans in one place.",
      logo: <LogoGitLab />,
      connected: false,
      comingSoon: true,
      color: "#fca121",
    },
    {
      id: "bitbucket",
      name: "Bitbucket",
      description:
        "Integrate Bitbucket Pipelines for a unified view of your deployments.",
      logo: <LogoBitbucket />,
      connected: false,
      comingSoon: true,
      color: "#2684ff",
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "48px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 800,
            marginBottom: "16px",
            background: "linear-gradient(to right, #06B6D4, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Connect your tools
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "18px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Easily integrate your favorite development and deployment platforms to
          unify your CI/CD monitoring.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {providers.map((p) => (
          <Card
            key={p.id}
            style={{
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s ease",
              borderColor: p.connected ? "var(--accent-cyan)" : "var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.color,
                }}
              >
                {p.logo}
              </div>
              {p.connected && (
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "var(--success)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  ● Connected
                </div>
              )}
            </div>

            <h3
              style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}
            >
              {p.name}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "24px",
                minHeight: "68px",
              }}
            >
              {p.description}
            </p>

            {p.comingSoon ? (
              <Button
                disabled
                variant="secondary"
                style={{ width: "100%", opacity: 0.5 }}
              >
                Coming Soon
              </Button>
            ) : (
              <Button
                onClick={p.action}
                loading={loadingProvider === p.id}
                variant={p.connected ? "secondary" : "primary"}
                style={{ width: "100%" }}
              >
                {p.connected ? "Manage Connection" : `Connect ${p.name}`}
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div
        style={{
          marginTop: "64px",
          padding: "32px",
          borderRadius: "24px",
          backgroundColor: "rgba(6, 182, 212, 0.03)",
          border: "1px solid rgba(6, 182, 212, 0.1)",
          textAlign: "center",
        }}
      >
        <h4 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
          Need another tool?
        </h4>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          We're constantly adding new providers. Let us know what you'd like to
          see next.
        </p>
        <Button
          variant="secondary"
          onClick={() =>
            window.open(
              "https://github.com/Dark-Side-Mora/dark-side/issues",
              "_blank",
            )
          }
        >
          Request Integration
        </Button>
      </div>
      {showJenkinsModal && jenkinsSetup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <Card
            style={{
              maxWidth: "600px",
              width: "100%",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border)",
              padding: "32px",
              borderRadius: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
                Jenkins Setup
              </h2>
              <button
                onClick={() => setShowJenkinsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "24px",
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "24px",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              Use this token in your Jenkins Pipeline code to push build data to
              CI-Insight. It serves as your unique identifier for all Jenkins
              projects.
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--accent-cyan)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Integration Token
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "12px 16px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "14px",
                }}
              >
                {jenkinsSetup.token}
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--accent-cyan)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Ingestion Endpoint
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "12px 16px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                }}
              >
                {jenkinsSetup.endpoint}
              </div>
            </div>

            <Button
              variant="primary"
              style={{ width: "100%" }}
              onClick={() => setShowJenkinsModal(false)}
            >
              Got it, thanks!
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
