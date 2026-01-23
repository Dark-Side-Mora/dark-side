"use client";

import { useState } from "react";
import { apiPatch } from "../api/client";

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
  created_at: string;
}

export const useProfile = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateProfile = async (profile: Partial<UserProfile>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const updated = await apiPatch<UserProfile>(
        `${API_URL}/auth/profile`,
        profile,
      );
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    updateProfile,
    saving,
    error,
    success,
    setError,
    setSuccess,
  };
};
