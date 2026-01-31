import { useState, useCallback, useMemo } from "react";
import { useOrganizationContext, Organization } from "./OrganizationContext";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface OrganizationMember {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
}

export const useOrganization = () => {
  const {
    currentOrgId,
    setCurrentOrgId,
    organizations,
    setOrganizations,
    loading,
    setLoading,
    initialFetchAttempted,
    setInitialFetchAttempted,
  } = useOrganizationContext();

  const [error, setError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Fetch projects under an organization
  const fetchOrganizationProjects = useCallback(
    async (orgId: string) => {
      setLoading(true);
      setError(null);
      try {
        const projects = await apiGet<any[]>(
          `${API_URL}/organizations/${orgId}/projects`,
        );
        return projects;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  // Fetch organizations the user is a member of
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInitialFetchAttempted(true);
    try {
      const data = await apiGet<Organization[]>(`${API_URL}/organizations`);
      setOrganizations(data);
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch organizations",
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setOrganizations, setInitialFetchAttempted]);

  // Select an organization (by id)
  const selectOrganization = useCallback(
    (orgId: string) => {
      setCurrentOrgId(orgId);
    },
    [setCurrentOrgId],
  );

  // Create organization
  const createOrganization = useCallback(
    async (name: string, domain: string) => {
      setLoading(true);
      setError(null);
      try {
        const org = await apiPost<Organization>(`${API_URL}/organizations`, {
          name,
          domain,
        });
        setOrganizations([...organizations, org]);
        return org;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create organization",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizations, setLoading, setOrganizations],
  );

  // Update organization name
  const updateOrganization = useCallback(
    async (id: string, name: string) => {
      setLoading(true);
      setError(null);
      try {
        const org = await apiPatch<Organization>(
          `${API_URL}/organizations/${id}`,
          { name },
        );
        setOrganizations(
          organizations.map((o) => (o.id === id ? { ...o, name } : o)),
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
    },
    [organizations, setLoading, setOrganizations],
  );

  // Delete organization
  const deleteOrganization = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiDelete(`${API_URL}/organizations/${id}`);
        setOrganizations(organizations.filter((o) => o.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete organization",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizations, setLoading, setOrganizations],
  );

  // Invite member
  const inviteMember = useCallback(
    async (orgId: string, userId: string, onSuccess?: () => void) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiPost(
          `${API_URL}/organizations/${orgId}/invite`,
          {
            userId,
          },
        );
        if (onSuccess) onSuccess();
        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to invite member",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  // Respond to membership request
  const respondToRequest = useCallback(
    async (orgId: string, accept: boolean) => {
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
    },
    [setLoading],
  );

  // Search users by domain and query, with orgId for filtering
  const searchUsers = useCallback(
    async (domain: string, q: string, orgId?: string) => {
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
    },
    [],
  );

  // Fetch sent membership requests (for owners)
  const fetchSentRequests = useCallback(async () => {
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
  }, []);

  // Fetch incoming membership requests (for users)
  const fetchIncomingRequests = useCallback(async () => {
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
  }, []);

  const fetchOrganizationMembers = useCallback(
    async (orgId: string): Promise<OrganizationMember[]> => {
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
    },
    [],
  );

  // Leave organization (member only)
  const leaveOrganization = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiPost(`${API_URL}/organizations/${id}/leave`, {});
        setOrganizations(organizations.filter((o) => o.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to leave organization",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [organizations, setLoading, setOrganizations],
  );

  return useMemo(
    () => ({
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
      fetchOrganizationProjects,
      initialFetchAttempted,
    }),
    [
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
      fetchOrganizationProjects,
      initialFetchAttempted,
    ],
  );
};
