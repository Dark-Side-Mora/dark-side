"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Input";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, domain: string, provider: string) => Promise<void>;
  loading: boolean;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading,
}) => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [provider, setProvider] = useState("jenkins");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) return;
    await onCreate(name, domain, provider);
    onClose();
  };

  return (
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
          maxWidth: "500px",
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
            Create Workspace
          </h2>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
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
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Local Lab"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--text-primary)",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
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
              Domain (Identifier)
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. local.jenkins"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--text-primary)",
                fontSize: "15px",
              }}
            />
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
              Primary Provider
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div
                onClick={() => setProvider("github")}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  border: `2px solid ${provider === "github" ? "var(--accent-cyan)" : "var(--border)"}`,
                  backgroundColor:
                    provider === "github"
                      ? "rgba(6, 182, 212, 0.05)"
                      : "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🐙</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>GitHub</div>
              </div>
              <div
                onClick={() => setProvider("jenkins")}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  border: `2px solid ${provider === "jenkins" ? "var(--accent-cyan)" : "var(--border)"}`,
                  backgroundColor:
                    provider === "jenkins"
                      ? "rgba(6, 182, 212, 0.05)"
                      : "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>📦</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Jenkins</div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: "100%" }}
            loading={loading}
            disabled={!name || !domain}
          >
            Create Workspace
          </Button>
        </form>
      </Card>
    </div>
  );
};
