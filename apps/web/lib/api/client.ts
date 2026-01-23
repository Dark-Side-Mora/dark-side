import { supabase } from "../supabase/client";

// Get the current auth token, refreshing if necessary
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("[API] No session found");
      return null;
    }

    // Check if token is expired
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();

      if (expiresAt < now) {
        console.log("[API] Token expired, attempting to refresh...");

        // Try to refresh the token using refresh token
        const { data, error } = await supabase.auth.refreshSession();

        if (error || !data.session) {
          console.error("[API] Failed to refresh token:", error);
          return null;
        }

        console.log("[API] Token refreshed successfully");
        return data.session.access_token;
      }
    }

    return session.access_token ?? null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Handle unauthorized responses - clear session and redirect to login
 */
async function handleUnauthorized() {
  console.warn(
    "[API] Received 401 Unauthorized - clearing session and redirecting to login",
  );

  // Clear Supabase session
  await supabase.auth.signOut();

  // Clear all storage and cookies
  if (typeof window !== "undefined") {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear all cookies including Supabase cookies (sb-* prefix)
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const cookieParts = cookie.split("=");
      const cookieName = cookieParts[0] ? cookieParts[0].trim() : "";
      if (cookieName) {
        // Set cookie with past date to delete it
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });

    console.log("[API] Cleared all storage and cookies");

    // Wait a bit for cookies to be cleared, then redirect
    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 100);
  }
}

/**
 * Test if the API is reachable
 */
export async function testAPIConnection(): Promise<boolean> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${API_URL}/auth/test`);
    const success = response.ok;
    console.log(`[API] Test endpoint: ${success ? "✓ Connected" : "✗ Failed"}`);
    return success;
  } catch (error) {
    console.error("[API] Test connection failed:", error);
    return false;
  }
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Fetch wrapper that automatically adds Supabase JWT token to requests
 */
export async function fetchWithAuth(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log("[API] Sending request with Bearer token");
  } else {
    console.warn("[API] No token available - request will be unauthenticated");
  }

  console.log(`[API] ${options.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    await handleUnauthorized();
  }

  return response;
}

/**
 * Helper for GET requests
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, { method: "GET" });

  if (response.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] GET ${url} failed:`, response.status, text);
    throw new Error(
      `API Error ${response.status}: ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data as T;
}

/**
 * Helper for POST requests
 */
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API Error ${response.status}: ${text || response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API Error ${response.status}: ${text || response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, { method: "DELETE" });

  if (response.status === 401) {
    throw new Error("Unauthorized - please login again");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API Error ${response.status}: ${text || response.statusText}`,
    );
  }

  return response.json();
}
