"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Project {
  id: string;
  name: string;
  provider: string;
  repositoryUrl: string;
  organizationId: string;
  createdAt: string;
  pipelines?: any[];
}

interface ProjectContextType {
  projectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  repositoryUrl: string | null;
  setRepositoryUrl: (url: string | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  initialFetchAttempted: boolean;
  setInitialFetchAttempted: (attempted: boolean) => void;
  projectCache: Record<string, Project[]>;
  setProjectCache: React.Dispatch<
    React.SetStateAction<Record<string, Project[]>>
  >;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [projectId, setCurrentProjectId] = useState<string | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const [projectCache, setProjectCache] = useState<Record<string, Project[]>>(
    {},
  );

  // Auto-select first project if none selected or if selected project is not in list
  React.useEffect(() => {
    if (loading) return;

    const isValidProject =
      projectId && projects.some((p) => p.id === projectId);

    if ((!projectId || !isValidProject) && projects.length > 0) {
      const first = projects[0];
      if (first) {
        setCurrentProjectId(first.id);
        setRepositoryUrl(first.repositoryUrl);
      }
    }
  }, [projects, projectId, loading]);

  const value = React.useMemo(
    () => ({
      projectId,
      setCurrentProjectId,
      repositoryUrl,
      setRepositoryUrl,
      projects,
      setProjects,
      loading,
      setLoading,
      initialFetchAttempted,
      setInitialFetchAttempted,
      projectCache,
      setProjectCache,
    }),
    [
      projectId,
      repositoryUrl,
      projects,
      loading,
      initialFetchAttempted,
      projectCache,
      setProjectCache,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error(
      "useProjectContext must be used within a ProjectContextProvider",
    );
  }
  return context;
};
