"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface OrganizationContextType {
  currentOrgId: string | null;
  setCurrentOrgId: (id: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  return (
    <OrganizationContext.Provider value={{ currentOrgId, setCurrentOrgId }}>
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
