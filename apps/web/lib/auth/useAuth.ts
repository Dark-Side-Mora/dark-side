"use client";

import { useState } from "react";
import { supabase } from "../supabase/client";
import type { AuthError, User } from "@supabase/supabase-js";

export interface SignUpCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  redirectTo?: string; // Added redirect URL option
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Sign up with email and password
  const signUp = async ({
    email,
    password,
    firstName,
    lastName,
    redirectTo,
  }: SignUpCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            redirectTo || `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  // Note: signInWithPassword does not take a redirectTo option in Supabase
  // because it is a direct login. You handle the redirect in your component code.
  const signIn = async ({ email, password }: SignInCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Check if email is verified
      if (data.session?.user && !data.session.user.email_confirmed_at) {
        // Sign out the user since email is not verified
        await supabase.auth.signOut();

        const emailVerificationError = new Error(
          "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
        ) as AuthError;
        setError(emailVerificationError);
        return { data: null, error: emailVerificationError };
      }
      return { data, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGitHub = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  // Get user profile from backend
  const getProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // First ensure we have a valid token by refreshing if needed
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Check if token is expired and refresh if necessary
      if (session.expires_at) {
        const expiresAt = session.expires_at * 1000;
        if (expiresAt < Date.now()) {
          console.log("[Auth] Token expired, refreshing...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            throw new Error("Failed to refresh token");
          }
          console.log("[Auth] Token refreshed successfully");
        }
      }

      // Now make the API call with the valid token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession?.access_token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Unauthorized - please login again");
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to fetch profile: ${text || response.statusText}`,
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      return { data: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    getProfile,
    loading,
    error,
  };
};
