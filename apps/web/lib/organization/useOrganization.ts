import { useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";

export interface Organization {
  id: string;
  name: string;
  domain: string;
  role: string;
}

export interface OrganizationMember {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
}

export const useOrganization = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // For organization list
  const [error, setError] = useState<string | null>(null);
  // Separate loading and error for requests (sent/incoming/search)
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Fetch organizations the user is a member of
  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Organization[]>(`${API_URL}/organizations`);
      setOrganizations(data);
      if (!currentOrgId && data.length > 0)
        setCurrentOrgId(data[0]?.id ?? null);
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch organizations",
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Select an organization (by id)
  const selectOrganization = (orgId: string) => {
    setCurrentOrgId(orgId);
  };

  // Create organization
  const createOrganization = async (name: string, domain: string) => {
    setLoading(true);
    setError(null);
    try {
      const org = await apiPost<Organization>(`${API_URL}/organizations`, {
        name,
        domain,
      });
      setOrganizations((prev) => [...prev, org]);
      return org;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update organization name
  const updateOrganization = async (id: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const org = await apiPatch<Organization>(
        `${API_URL}/organizations/${id}`,
        { name },
      );
      setOrganizations((prev) =>
        prev.map((o) => (o.id === id ? { ...o, name } : o)),
      );
      return org;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update organization",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete organization
  const deleteOrganization = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`${API_URL}/organizations/${id}`);
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete organization",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Invite member
  const inviteMember = async (
    orgId: string,
    userId: string,
    onSuccess?: () => void,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost(`${API_URL}/organizations/${orgId}/invite`, {
        userId,
      });
      if (onSuccess) onSuccess();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Respond to membership request
  const respondToRequest = async (orgId: string, accept: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost(
        `${API_URL}/organizations/${orgId}/respond`,
        { accept },
      );
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to respond to request",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search users by domain and query, with orgId for filtering
  const searchUsers = async (domain: string, q: string, orgId?: string) => {
    if (q.length < 3) return [];
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      let url = `${API_URL}/organizations/search-users?domain=${encodeURIComponent(domain)}&q=${encodeURIComponent(q)}`;
      if (orgId) url += `&orgId=${encodeURIComponent(orgId)}`;
      const users = await apiGet(url);
      return users;
    } catch (err) {
      setRequestsError(
        err instanceof Error ? err.message : "Failed to search users",
      );
      return [];
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch sent membership requests (for owners)
  const fetchSentRequests = async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await apiGet(`${API_URL}/organizations/sent-requests`);
      return data;
    } catch (err) {
      setRequestsError(
        err instanceof Error ? err.message : "Failed to fetch sent requests",
      );
      return [];
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch incoming membership requests (for users)
  const fetchIncomingRequests = async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const data = await apiGet(`${API_URL}/organizations/incoming-requests`);
      return data;
    } catch (err) {
      setRequestsError(
        err instanceof Error
          ? err.message
          : "Failed to fetch incoming requests",
      );
      return [];
    } finally {
      setRequestsLoading(false);
    }
  };
  const fetchOrganizationMembers = async (
    orgId: string,
  ): Promise<OrganizationMember[]> => {
    try {
      const members = await apiGet<OrganizationMember[]>(
        `${API_URL}/organizations/${orgId}/members`,
      );
      return members;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch organization members",
      );
      return [];
    }
  };

  // Leave organization (member only)
  const leaveOrganization = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiPost(`${API_URL}/organizations/${id}/leave`, {});
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to leave organization",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    organizations,
    currentOrgId,
    loading,
    error,
    fetchOrganizations,
    setOrganizations,
    selectOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    respondToRequest,
    searchUsers,
    fetchSentRequests,
    fetchIncomingRequests,
    leaveOrganization,
    requestsLoading,
    requestsError,
    fetchOrganizationMembers,
  };
};
