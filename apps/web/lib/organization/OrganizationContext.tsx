"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Organization {
  id: string;
  name: string;
  domain: string;
  role: string;
  provider?: string;
}

interface OrganizationContextType {
  currentOrgId: string | null;
  setCurrentOrgId: (id: string | null) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  initialFetchAttempted: boolean;
  setInitialFetchAttempted: (attempted: boolean) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentOrgId");
    }
    return null;
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);

  // Auto-select first organization if none selected
  React.useEffect(() => {
    if (!currentOrgId && organizations.length > 0) {
      // Check storage one more time or default to first
      const stored = localStorage.getItem("currentOrgId");
      const validStored = stored && organizations.find((o) => o.id === stored);
      const toSelect = validStored ? stored : organizations[0]?.id;

      if (toSelect) {
        setCurrentOrgId(toSelect);
        localStorage.setItem("currentOrgId", toSelect);
      }
    }
  }, [organizations, currentOrgId]);

  // Persist selection changes
  const handleSetCurrentOrgId = React.useCallback((id: string | null) => {
    setCurrentOrgId(id);
    if (id) {
      localStorage.setItem("currentOrgId", id);
    } else {
      localStorage.removeItem("currentOrgId");
    }
  }, []);

  const value = React.useMemo(
    () => ({
      currentOrgId,
      setCurrentOrgId: handleSetCurrentOrgId,
      organizations,
      setOrganizations,
      loading,
      setLoading,
      initialFetchAttempted,
      setInitialFetchAttempted,
    }),
    [currentOrgId, organizations, loading, initialFetchAttempted],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizationContext = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganizationContext must be used within an OrganizationProvider",
    );
  }
  return context;
};
