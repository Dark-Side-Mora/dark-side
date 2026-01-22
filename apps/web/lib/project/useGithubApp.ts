import { apiGet, apiPost } from "../api/client";

export const useGithubApp = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Authorize GitHub App
  const authorizeGithubApp = async (redirectUri: string) => {
    return apiPost(`${API_URL}/integrations/github-app/authorize`, {
      redirectUri,
    });
  };

  // Check if GitHub App is authorized
  const checkGithubAppAuthorized = async () => {
    return apiGet(`${API_URL}/integrations/github-app/installations`);
  };

  // Fetch installations
  const fetchInstallations = async () => {
    return apiGet(`${API_URL}/integrations/github-app/installations`);
  };

  // Sync installation
  // const syncInstallation = async (installationId: string) => {
  //     return apiPost(`${API_URL}/integrations/github-app/installations/${installationId}/sync`, {});
  // };

  return {
    authorizeGithubApp,
    checkGithubAppAuthorized,
    fetchInstallations,
    // syncInstallation,
  };
};
