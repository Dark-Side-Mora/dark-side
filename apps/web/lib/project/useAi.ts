import { useState, useCallback } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useAiSecurity(userId: string) {
  const [installations, setInstallations] = useState<any[]>([]);
  const [securityAnalysis, setSecurityAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch installations (repos)
  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiGet(
        `${API_URL}/integrations/github-app/installations?userId=${userId}`,
      );
      const typedData = data as { data?: { installations?: any[] } };
      if (typedData.data?.installations) {
        setInstallations(typedData.data.installations);
      } else {
        setInstallations([]);
      }
    } catch (e) {
      setInstallations([]);
      setMessage("Error loading installations");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch security analysis for selected repo
  const fetchSecurityAnalysis = useCallback(
    async (selectedRepo: string) => {
      if (!selectedRepo) return;
      setLoading(true);
      setMessage("");
      setSecurityAnalysis(null);
      try {
        const encodedRepo = encodeURIComponent(selectedRepo);
        const data = await apiGet(
          `${API_URL}/pipelines/github/${encodedRepo}/analyze?userId=${userId}`,
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
          setMessage("");
        } else {
          setMessage("No security analysis found");
        }
      } catch (e) {
        setMessage("Error fetching security analysis");
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

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
