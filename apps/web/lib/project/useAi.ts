import { useState, useCallback } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useAiSecurity(userId: string) {
  const [installations, setInstallations] = useState<any[]>([]);
  const [securityAnalysis, setSecurityAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Fetch installations (repos)
  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage("");
    try {
      const data = await apiGet<any>(
        `${API_URL}/integrations/github-app/installations`,
      );
      const typedData = data as { data?: { installations?: any[] } };
      if (typedData.data?.installations) {
        setInstallations(typedData.data.installations);
      } else {
        setInstallations([]);
      }
    } catch (err) {
      setInstallations([]);
      setError(
        err instanceof Error ? err.message : "Failed to fetch installations",
      );
      setMessage(
        err instanceof Error ? err.message : "Error loading installations",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch security analysis for selected repo
  const fetchSecurityAnalysis = useCallback(async (selectedRepo: string) => {
    if (!selectedRepo) return;
    setLoading(true);
    setError(null);
    setMessage("");
    setSecurityAnalysis(null);
    try {
      const encodedRepo = encodeURIComponent(selectedRepo);
      const data = await apiGet<any>(
        `${API_URL}/pipelines/github/${encodedRepo}/analyze`,
      );
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in data &&
        typeof (data as any).data === "object" &&
        (data as any).data !== null &&
        "securityAnalysis" in (data as any).data
      ) {
        setSecurityAnalysis((data as any).data.securityAnalysis);
      } else {
        setMessage("No security analysis found");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch security analysis",
      );
      setMessage(
        err instanceof Error ? err.message : "Error fetching security analysis",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    installations,
    securityAnalysis,
    loading,
    message,
    fetchInstallations,
    fetchSecurityAnalysis,
    setSecurityAnalysis,
    setMessage,
  };
}
