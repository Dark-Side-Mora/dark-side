"use client";

import React, { useState, useEffect } from "react";
import { Shell } from "../../components/ui/Shell";
import { Button } from "../../components/ui/Button";
import { Card, Input } from "../../components/ui/Input";
import { useAuthContext } from "../../lib/auth/auth-context";
import { useAuth } from "../../lib/auth/useAuth";
import { apiPatch, testAPIConnection } from "../../lib/api/client";
import { useProfile } from "@/lib/auth/useProfile";

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
  created_at: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState("Profile");
  const { user, isLoading: authLoading, isAuthenticated } = useAuthContext();
  const { getProfile, loading: profileLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { updateProfile, saving, error, success, setError, setSuccess } =
    useProfile();
  const [bio, setBio] = useState("");

  useEffect(() => {
    // Test API connection on mount
    testAPIConnection();

    if (!authLoading && isAuthenticated && user) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      setError(null);
      const { data, error } = await getProfile();

      if (error) {
        setError(error.message || "Failed to fetch profile");
        return;
      }

      if (data) {
        if (!data.fullName) {
          data.fullName =
            `${user?.user_metadata?.first_name || ""} ${user?.user_metadata?.last_name || ""}`.trim();
        }
        setProfile(data);
        setBio(data.bio || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updated = await updateProfile({
        fullName: profile?.fullName,
        bio,
      });
      setProfile(updated);
      setError(null);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    }
  };

  const renderContent = () => {
    switch (tab) {
      case "Profile":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            {error && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                  fontSize: "14px",
                }}
              >
                {success}
              </div>
            )}
            <Card title="Public Profile">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "20px",
                    backgroundColor: "var(--accent-cyan)",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {(profile?.email && profile.email[0]?.toUpperCase()) || "U"}
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    Your Profile Picture
                  </h4>
                  <p
                    style={{ color: "var(--text-secondary)", fontSize: "12px" }}
                  >
                    Upload a new image or use a generated avatar.
                  </p>
                  <div
                    style={{ marginTop: "12px", display: "flex", gap: "8px" }}
                  >
                    <Button variant="secondary" size="sm" disabled>
                      Upload
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                <Input
                  label="Full Name"
                  value={profile?.fullName || ""}
                  disabled={true}
                  placeholder="Enter your full name"
                />
                <Input
                  label="Email Address"
                  value={profile?.email || ""}
                  disabled
                />
              </div>
              <Input
                label="Bio"
                value={bio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBio(e.target.value)
                }
                disabled={profileLoading}
                placeholder="Tell us about yourself"
              />
              <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                <Button
                  onClick={handleSaveChanges}
                  disabled={saving || profileLoading}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={saving || profileLoading}
                  onClick={() => {
                    setBio(profile?.bio || "");
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        );
      case "Organization":
        return (
          <Card title="Organization Settings">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <Input label="Organization Name" defaultValue="Main Hub" />
              <Input label="Domain" defaultValue="enterprise.com" />
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  Active Members
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      name: "John Doe",
                      role: "Owner",
                      email: "john@enterprise.com",
                    },
                    {
                      name: "Jane Smith",
                      role: "Admin",
                      email: "jane@enterprise.com",
                    },
                    {
                      name: "Mike Johnson",
                      role: "Member",
                      email: "mike@enterprise.com",
                    },
                  ].map((m) => (
                    <div
                      key={m.email}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>
                          {m.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {m.email}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--accent-cyan)",
                        }}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Button style={{ width: "fit-content" }}>Invite Member</Button>
            </div>
          </Card>
        );
      case "Security":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <Card title="Authentication">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>
                      Two-Factor Authentication
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Add an extra layer of security to your account.
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Enable
                  </Button>
                </div>
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "20px",
                  }}
                >
                  <Button variant="secondary">Change Password</Button>
                </div>
              </div>
            </Card>
            <Card title="Access Tokens">
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginBottom: "16px",
                }}
              >
                Generate personal access tokens to use the CI-Insight CLI or
                API.
              </p>
              <Button variant="secondary" size="sm">
                Generate New Token
              </Button>
            </Card>
          </div>
        );
      case "Billing":
        return (
          <Card title="Subscription & Billing">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "rgba(6, 182, 212, 0.05)",
                  borderRadius: "12px",
                  border: "1px solid var(--accent-cyan)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--accent-cyan)",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  Current Plan
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800 }}>
                  Pro License
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                  }}
                >
                  $49.00 / month • Renews on Nov 14, 2024
                </div>
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  Payment Method
                </h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "24px",
                      backgroundColor: "#333",
                      borderRadius: "4px",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>
                      Visa ending in 4242
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Expires 12/26
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
              <Button variant="secondary">View Invoices</Button>
            </div>
          </Card>
        );
      case "Integrations":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {[
              {
                name: "Supabase",
                active: true,
                desc: "Identity & Data Layer",
                status: "Connected",
              },
              {
                name: "GitHub Actions",
                active: true,
                desc: "Primary CI Provider",
                status: "Connected",
              },
              {
                name: "Gemini AI",
                active: true,
                desc: "Intelligent Diagnostics",
                status: "Active",
              },
              {
                name: "OpenSearch",
                active: true,
                desc: "Log Aggregator",
                status: "Connected",
              },
              {
                name: "Slack",
                active: false,
                desc: "Notifications",
                status: "Disconnected",
              },
            ].map((app) => (
              <Card
                key={app.name}
                glass={false}
                style={{ padding: "16px 24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {app.name === "GitHub Actions"
                        ? "🐙"
                        : app.name === "Slack"
                          ? "💬"
                          : "⚡"}
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600 }}>
                        {app.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {app.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: app.active
                          ? "var(--success)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {app.status}
                    </span>
                    <Button
                      variant={app.active ? "secondary" : "primary"}
                      size="sm"
                    >
                      {app.active ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Shell activePage="Settings">
      <div style={{ maxWidth: "800px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>
          Settings
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            marginBottom: "32px",
          }}
        >
          Manage your account settings and platform integrations.
        </p>

        <div
          style={{
            display: "flex",
            gap: "32px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "32px",
          }}
        >
          {[
            "Profile",
            "Organization",
            "Security",
            "Billing",
            "Integrations",
          ].map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: 600,
                color:
                  tab === t ? "var(--accent-cyan)" : "var(--text-secondary)",
                borderBottom:
                  tab === t
                    ? "2px solid var(--accent-cyan)"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {renderContent()}
      </div>
    </Shell>
  );

  // Show auth prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <Shell activePage="Settings">
        <div style={{ maxWidth: "800px" }}>
          <h2
            style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}
          >
            Settings
          </h2>
          <Card style={{ marginTop: "32px" }}>
            <div style={{ textAlign: "center", padding: "32px" }}>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--text-secondary)",
                  marginBottom: "16px",
                }}
              >
                Please log in to access your settings.
              </p>
              <Button onClick={() => (window.location.href = "/auth/login")}>
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }
}
