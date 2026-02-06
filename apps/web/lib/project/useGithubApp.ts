import { apiGet, apiPost } from "../api/client";
import { useOrganizationContext } from "../organization/OrganizationContext";

export const useGithubApp = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Call hooks at the top level
  const organizationContext = useOrganizationContext();

  // Authorize GitHub App and create tracking record
  const authorizeGithubApp = async (redirectUri: string) => {
    const orgId = organizationContext.currentOrgId;
    return apiPost(`${API_URL}/integrations/github-app/authorize`, {
      redirectUri,
      organizationId: orgId,
    });
  };

  // Fetch installations
  const fetchInstallations = async (include_repos: boolean = false) => {
    return apiGet(
      `${API_URL}/integrations/github-app/installations?include_repos=${include_repos}`,
    );
  };

  // Get GitHub App installation URL
  const installGithubApp = async (redirectUri: string) => {
    const orgId = organizationContext.currentOrgId;
    return apiPost(`${API_URL}/integrations/github-app/install`, {
      redirectUri,
      organizationId: orgId,
    });
  };

  // Sync repositories for a specific organization
  const syncRepositoriesForOrganization = async (organizationId?: string) => {
    const orgId = organizationId || organizationContext.organizations?.[0]?.id;
    if (!orgId) {
      throw new Error("No organization selected");
    }

    return apiPost(
      `${API_URL}/integrations/github-app/organizations/${orgId}/sync-repos`,
      {},
    );
  };

  return {
    authorizeGithubApp,
    fetchInstallations,
    installGithubApp,
    syncRepositoriesForOrganization,
  };
};
