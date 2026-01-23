"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Project } from "./useProject";

interface ProjectContextType {
  projectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  repositoryUrl: string | null;
  setRepositoryUrl: (url: string | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
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
  return (
    <ProjectContext.Provider
      value={{
        projectId,
        setCurrentProjectId,
        repositoryUrl,
        setRepositoryUrl,
        projects,
        setProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
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
