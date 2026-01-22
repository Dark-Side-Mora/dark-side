import { useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { useProjectContext } from "./ProjectContext";

export interface Project {
  id: string;
  name: string;
  provider: string;
  repositoryUrl: string;
  createdAt: string;
  pipelines?: any[];
}

export const useProject = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    projectId,
    repositoryUrl,
    setCurrentProjectId,
    setRepositoryUrl,
    projects,
    setProjects,
  } = useProjectContext();

  // Fetch projects for an organization
  const fetchProjects = async (orgId: string): Promise<Project[]> => {
    setLoading(true);
    setError(null);
    try {
      const projects = await apiGet<Project[]>(
        `${API_URL}/organizations/${orgId}/projects`,
      );
      setProjects(projects);
      if (
        typeof projects !== "undefined" &&
        projects.length > 0 &&
        !projectId
      ) {
        const firstProject = projects[0];
        if (firstProject) {
          setCurrentProjectId(firstProject.id);
          setRepositoryUrl(firstProject.repositoryUrl);
        }
      }
      return projects;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new project under an organization
  const createProject = async (
    orgId: string,
    data: any,
  ): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      // Ensure organizationId is in the body
      const body = { ...data, organizationId: orgId };
      const project = await apiPost<Project>(
        `${API_URL}/organizations/projects`,
        body,
      );
      setProjects([...projects, project]);
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a project
  const updateProject = async (
    projectId: string,
    data: any,
  ): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const project = await apiPatch<Project>(
        `${API_URL}/projects/${projectId}`,
        data,
      );
      setProjects(projects.map((p) => (p.id === projectId ? project : p)));
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (projectId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`${API_URL}/projects/${projectId}`);
      setProjects(projects.filter((p) => p.id !== projectId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    projects,
    projectId,
    repositoryUrl,
    setProjects,
    setCurrentProjectId,
    setRepositoryUrl,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
