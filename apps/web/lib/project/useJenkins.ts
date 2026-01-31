import { useState, useCallback } from "react";
import { apiGet } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useJenkins() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ token: string; endpoint: string }>(
        `${API_URL}/integrations/jenkins/setup`,
      );
      return res;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch Jenkins setup",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getSetup,
    loading,
    error,
  };
}
