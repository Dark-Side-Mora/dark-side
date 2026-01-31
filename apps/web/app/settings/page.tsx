"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Card, Input } from "../../components/ui/Input";
import { useAuthContext } from "../../lib/auth/auth-context";
import { useAuth } from "../../lib/auth/useAuth";
import { useProfile } from "@/lib/auth/useProfile";
import {
  useOrganization,
  OrganizationMember,
} from "@/lib/organization/useOrganization";

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
  const {
    organizations,
    loading: orgLoading,
    error: orgError,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    searchUsers,
    fetchSentRequests,
    fetchIncomingRequests,
    respondToRequest,
    leaveOrganization,
    fetchOrganizationMembers,
  } = useOrganization() as ReturnType<typeof useOrganization> & {
    fetchSentRequests: () => Promise<any[]>;
    fetchIncomingRequests: () => Promise<any[]>;
    fetchOrganizationMembers: (orgId: string) => Promise<OrganizationMember[]>;
  };
  // State for expanded orgs and their members
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<
    Record<string, OrganizationMember[]>
  >({});
  const [orgMembersLoading, setOrgMembersLoading] = useState<
    Record<string, boolean>
  >({});
  const [orgMembersError, setOrgMembersError] = useState<
    Record<string, string | null>
  >({});

  const handleToggleOrgMembers = async (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
      return;
    }
    setExpandedOrgId(orgId);
    if (!orgMembers[orgId]) {
      setOrgMembersLoading((prev) => ({ ...prev, [orgId]: true }));
      setOrgMembersError((prev) => ({ ...prev, [orgId]: null }));
      try {
        const members = await fetchOrganizationMembers(orgId);
        setOrgMembers((prev) => ({ ...prev, [orgId]: members }));
      } catch (err: any) {
        setOrgMembersError((prev) => ({
          ...prev,
          [orgId]: err?.message || "Failed to load members",
        }));
      } finally {
        setOrgMembersLoading((prev) => ({ ...prev, [orgId]: false }));
      }
    }
  };

  // State for pending invitations (organizations the user is invited to but not a member of)
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState<string | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<any[]>([]);

  useEffect(() => {
    // Test API connection on mount
    if (!authLoading && isAuthenticated && user) {
      fetchProfile();
      fetchOrganizations();
    }
  }, [authLoading, isAuthenticated, user]);

  // Fetch pending invitations only after organizations are loaded
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !orgLoading) {
      setPendingLoading(true);
      setPendingError(null);
      fetchIncomingRequests()
        .then((all) => {
          const orgIds = new Set((organizations || []).map((o) => o.id));
          setPendingInvites(
            Array.isArray(all)
              ? all.filter((r) => !orgIds.has(r.organizationId))
              : [],
          );
        })
        .catch((err) => {
          setPendingError(
            err instanceof Error ? err.message : "Failed to fetch invitations",
          );
        })
        .finally(() => setPendingLoading(false));
    }
  }, [authLoading, isAuthenticated, user, orgLoading]);

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
                  backgroundColor: "var(--error-bg)",
                  border: "1px solid var(--error-border)",
                  color: "var(--error-text)",
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
                  backgroundColor: "var(--success-bg)",
                  border: "1px solid var(--success-border)",
                  color: "var(--success-text)",
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
                    color: "var(--accent-cyan-text)",
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
          <Card title="Your Organizations">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {orgError && (
                <div style={{ color: "var(--error-text)", fontSize: 14 }}>
                  {orgError}
                </div>
              )}
              {orgLoading ? (
                <div>Loading organizations...</div>
              ) : organizations.length === 0 ? (
                <div style={{ color: "var(--text-secondary)" }}>
                  You are not a member of any organizations.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        backgroundColor: "var(--card-bg)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>
                            {org.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {org.domain}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: "var(--accent-cyan)",
                            }}
                          >
                            {org.role}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleOrgMembers(org.id)}
                          >
                            {expandedOrgId === org.id
                              ? "Hide Members"
                              : "Show Members"}
                          </Button>
                          {org.role === "owner" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={async () => {
                                  const newName = prompt(
                                    "Enter new organization name",
                                    org.name,
                                  );
                                  if (newName && newName !== org.name) {
                                    try {
                                      await updateOrganization(org.id, newName);
                                      await fetchOrganizations();
                                    } catch {}
                                  }
                                }}
                              >
                                Rename
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Delete organization '${org.name}'? This cannot be undone.`,
                                    )
                                  ) {
                                    try {
                                      await deleteOrganization(org.id);
                                      await fetchOrganizations();
                                    } catch {}
                                  }
                                }}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setInviteOrgId(org.id)}
                              >
                                Invite
                              </Button>
                            </>
                          )}
                          {org.role !== "owner" && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                if (
                                  confirm(`Leave organization '${org.name}'?`)
                                ) {
                                  try {
                                    await leaveOrganization(org.id);
                                  } catch (e) {
                                    alert("Failed to leave organization");
                                  }
                                }
                              }}
                            >
                              Leave
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Member List Section */}
                      {expandedOrgId === org.id && (
                        <div
                          style={{
                            marginTop: 12,
                            background: "var(--dropdown-bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            padding: 12,
                          }}
                        >
                          {orgMembersLoading[org.id] ? (
                            <div>Loading members...</div>
                          ) : orgMembersError[org.id] ? (
                            <div style={{ color: "var(--error-text)" }}>
                              {orgMembersError[org.id]}
                            </div>
                          ) : (orgMembers[org.id]?.length ?? 0) > 0 ? (
                            <table style={{ width: "100%", fontSize: 13 }}>
                              <thead>
                                <tr style={{ color: "var(--accent-cyan)" }}>
                                  <th style={{ textAlign: "left", padding: 4 }}>
                                    Name
                                  </th>
                                  <th style={{ textAlign: "left", padding: 4 }}>
                                    Email
                                  </th>
                                  <th style={{ textAlign: "left", padding: 4 }}>
                                    Role
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(orgMembers[org.id] ?? []).map((m) => (
                                  <tr key={m.userId}>
                                    <td style={{ padding: 4 }}>
                                      {m.fullName || "-"}
                                    </td>
                                    <td style={{ padding: 4 }}>{m.email}</td>
                                    <td style={{ padding: 4 }}>{m.role}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div style={{ color: "var(--text-secondary)" }}>
                              No members found.
                            </div>
                          )}
                        </div>
                      )}
                      {/* Sent/Incoming Requests Section for this org */}
                      <OrganizationRequestsSection
                        organization={org}
                        fetchSentRequests={fetchSentRequests}
                        fetchIncomingRequests={fetchIncomingRequests}
                        respondToRequest={respondToRequest}
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* Pending Invitations for organizations the user is not a member of */}
              {pendingLoading ? (
                <div>Loading invitations...</div>
              ) : (
                pendingInvites.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--accent-cyan)",
                        marginBottom: 8,
                      }}
                    >
                      Pending Invitations
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {pendingInvites.map((invite) => (
                        <div
                          key={invite.organizationId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "var(--card-bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontSize: 14,
                            }}
                          >
                            {invite.organizationName}
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  await respondToRequest(
                                    invite.organizationId,
                                    true,
                                  );
                                  setPendingInvites((prev) =>
                                    prev.filter(
                                      (i) =>
                                        i.organizationId !==
                                        invite.organizationId,
                                    ),
                                  );
                                  await fetchOrganizations();
                                } catch {}
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                try {
                                  await respondToRequest(
                                    invite.organizationId,
                                    false,
                                  );
                                  setPendingInvites((prev) =>
                                    prev.filter(
                                      (i) =>
                                        i.organizationId !==
                                        invite.organizationId,
                                    ),
                                  );
                                } catch {}
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
              {/* Invite Member Inline Search */}
              {inviteOrgId && (
                <div
                  style={{
                    marginTop: 24,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 24,
                    maxWidth: 400,
                  }}
                >
                  <h3
                    style={{
                      marginBottom: 12,
                      color: "var(--accent-cyan)",
                      fontWeight: 700,
                    }}
                  >
                    Invite Member
                  </h3>
                  <Input
                    label="Search by email"
                    value={inviteQuery}
                    onChange={async (
                      e: React.ChangeEvent<HTMLInputElement>,
                    ) => {
                      setInviteQuery(e.target.value);
                      if (e.target.value.length >= 3) {
                        const org = organizations.find(
                          (o) => o.id === inviteOrgId,
                        );
                        if (org) {
                          const users = await searchUsers(
                            org.domain,
                            e.target.value,
                            org.id,
                          );
                          setInviteResults(users as any[]);
                        }
                      } else {
                        setInviteResults([]);
                      }
                    }}
                    style={{ marginBottom: 8 }}
                    autoFocus
                  />
                  <div
                    style={{
                      background: "var(--dropdown-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      marginTop: 4,
                      minHeight: 36,
                      boxShadow: "var(--dropdown-shadow)",
                    }}
                  >
                    {inviteQuery.length < 3 ? (
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          padding: 8,
                          fontSize: 13,
                        }}
                      >
                        Type at least 3 characters to search users.
                      </div>
                    ) : inviteResults.length === 0 ? (
                      <div
                        style={{
                          color: "var(--error-text)",
                          padding: 8,
                          fontSize: 13,
                        }}
                      >
                        No users found.
                      </div>
                    ) : (
                      inviteResults.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: 8,
                            borderBottom: "1px solid var(--border-light)",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontSize: 14,
                            }}
                          >
                            {u.fullName ? (
                              <>
                                {u.fullName}{" "}
                                <span
                                  style={{
                                    color: "var(--text-secondary)",
                                    fontSize: 12,
                                  }}
                                >
                                  ({u.email})
                                </span>
                              </>
                            ) : (
                              u.email
                            )}
                          </span>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await inviteMember(
                                  inviteOrgId,
                                  u.id,
                                  async () => {
                                    // Refresh sent requests for this org if visible
                                    // Find the OrganizationRequestsSection for this org and trigger refresh
                                    // (We rely on useEffect in OrganizationRequestsSection to refetch on prop change)
                                  },
                                );
                                setInviteOrgId(null);
                                setInviteQuery("");
                                setInviteResults([]);
                              } catch {}
                            }}
                          >
                            Invite
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setInviteOrgId(null);
                        setInviteQuery("");
                        setInviteResults([]);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
              {/* Manual creation is now disabled in favor of GitHub App auto-onboarding */}
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
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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
        {["Profile", "Organization", "Security", "Billing", "Integrations"].map(
          (t) => (
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
          ),
        )}
      </div>

      {renderContent()}
    </div>
  );

  // Show auth prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>
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
    );
  }
}

// --- Add this component at the bottom of the file ---

type Organization = {
  id: string;
  name: string;
  domain: string;
  role: string;
};

function OrganizationRequestsSection({
  organization,
  fetchSentRequests,
  fetchIncomingRequests,
  respondToRequest,
}: {
  organization: Organization;
  fetchSentRequests: () => Promise<any[]>;
  fetchIncomingRequests: () => Promise<any[]>;
  respondToRequest: (organizationId: string, accept: boolean) => void;
}) {
  const [sentRequests, setSentRequests] = React.useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    if (organization.role === "owner") {
      fetchSentRequests()
        .then((all) => {
          setSentRequests(
            (all || []).filter((r) => r.organizationId === organization.id),
          );
        })
        .finally(() => setLoading(false));
    } else {
      fetchIncomingRequests()
        .then((all) => {
          setIncomingRequests(
            (all || []).filter((r) => r.organizationId === organization.id),
          );
        })
        .finally(() => setLoading(false));
    }
  }, [organization.id, organization.role]);

  if (loading)
    return (
      <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        Loading requests...
      </div>
    );

  if (organization.role === "owner") {
    return (
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontWeight: 600,
            color: "var(--accent-cyan)",
            marginBottom: 8,
          }}
        >
          Sent Invitations
        </div>
        {sentRequests.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            No invitations sent.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sentRequests.map((req) => {
              let statusLabel = "Pending";
              let statusColor = "var(--text-secondary)";
              if (req.status === "accepted") {
                statusLabel = "Accepted";
                statusColor = "var(--success)";
              } else if (req.status === "rejected") {
                statusLabel = "Rejected";
                statusColor = "var(--error-text)";
              }
              return (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <span style={{ color: "var(--text-primary)", fontSize: 14 }}>
                    {req.userFullName || req.userEmail}
                  </span>
                  <span style={{ color: statusColor, fontSize: 13 }}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div style={{ marginTop: 12 }}>
        {incomingRequests.length === 0 ? (
          <div></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontWeight: 600,
                color: "var(--accent-cyan)",
                marginBottom: 8,
              }}
            >
              Incoming Invitations
            </div>
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                <span style={{ color: "var(--text-primary)", fontSize: 14 }}>
                  {req.organizationName}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => respondToRequest(req.organizationId, true)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => respondToRequest(req.organizationId, false)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
