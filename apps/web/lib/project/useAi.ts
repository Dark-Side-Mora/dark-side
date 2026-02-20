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

export function useAnalyzeLogs() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(
    async (logs: string, workflowFile: string) => {
      setAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const prompt = `Analyze these CI/CD logs and workflow file. Provide the response in JSON format with these fields:
{
  "summary": "brief summary of what happened",
  "reasons": "reasons why it failed (if applicable)",
  "suggestedFixes": "suggested fixes to resolve the issues (if applicable)"
}

Logs:
${logs}

Workflow File:
${workflowFile}`;

        return new Promise((resolve, reject) => {
          const callbackName = `callback_${Date.now()}`;

          const script = document.createElement("script");
          script.src = `https://script.google.com/macros/s/AKfycbz9rda1CigkmnqI7007oq-RI-mHKDVc1lizJ7evLdCGlr2ML1GHuJU-bAO0y67isiy03A/exec?action=askFromGemini&callback=${callbackName}`;
          script.onerror = () => {
            setAnalysisError("Failed to load analysis");
            setAnalysisLoading(false);
            reject(new Error("JSONP request failed"));
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any)[callbackName] = (data: any) => {
            const analysisResult = data?.content
              ? typeof data.content === "string"
                ? JSON.parse(data.content)
                : data.content
              : data;
            setAnalysisData(analysisResult);
            setAnalysisLoading(false);
            document.body.removeChild(script);
            delete (window as any)[callbackName];
            resolve(analysisResult);
          };

          document.body.appendChild(script);

          // Send prompt separately via FormData to avoid long URLs
          const formData = new FormData();
          formData.append("action", "askFromGemini");
          formData.append("prompt", prompt);

          fetch(
            `https://script.google.com/macros/s/AKfycbz9rda1CigkmnqI7007oq-RI-mHKDVc1lizJ7evLdCGlr2ML1GHuJU-bAO0y67isiy03A/exec?callback=${callbackName}`,
            {
              method: "POST",
              body: formData,
            },
          ).catch((err) =>
            console.log("Form data sent (response ignored for JSONP):", err),
          );
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to analyze logs";
        setAnalysisError(errorMsg);
        setAnalysisData({ error: errorMsg });
        console.error("[useAnalyzeLogs] Error:", errorMsg);
        setAnalysisLoading(false);
        throw error;
      }
    },
    [],
  );

  return {
    analysisData,
    analysisLoading,
    analysisError,
    setAnalysisData,
    setAnalysisError,
    setAnalysisLoading,
    fetchAnalysis,
  };
}
