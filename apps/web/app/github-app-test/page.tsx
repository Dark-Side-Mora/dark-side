"use client";

import { useEffect } from "react";

/**
 * This page exists to handle a potential misconfiguration in the GitHub App settings
 * where the "Setup URL" or "Callback URL" points to /github-app-test instead of the backend.
 *
 * We catch the request here and forward the query parameters (code, installation_id, state)
 * to the actual API callback endpoint.
 */
export default function GithubAppTestRedirect() {
  useEffect(() => {
    // Construct API Callback URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const callbackEndpoint = `${API_URL}/integrations/github-app/callback`;

    // Forward the current query parameters
    const params = new URLSearchParams(window.location.search);
    const targetUrl = `${callbackEndpoint}?${params.toString()}`;

    console.log("[GithubAppTest] Forwarding to backend:", targetUrl);
    window.location.href = targetUrl;
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2>Processing GitHub Connection...</h2>
      <p>Redirecting to server...</p>
    </div>
  );
}
