"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { useProjectContext, Project } from "./ProjectContext";
import { useOrganization } from "../organization/useOrganization";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const useProject = () => {
  const [error, setError] = useState<string | null>(null);
  const {
    projectId,
    repositoryUrl,
    setCurrentProjectId,
    setRepositoryUrl,
    projects,
    setProjects,
    loading,
    setLoading,
    initialFetchAttempted,
    setInitialFetchAttempted,
    projectCache,
    setProjectCache,
  } = useProjectContext();

  // Fetch projects for an organization
  const fetchProjects = useCallback(
    async (orgId: string): Promise<Project[]> => {
      setLoading(true);
      setError(null);
      setInitialFetchAttempted(true);

      try {
        const projects = await apiGet<Project[]>(
          `${API_URL}/organizations/${orgId}/projects`,
        );
        setProjects(projects);
        setProjectCache((prev) => ({ ...prev, [orgId]: projects }));
        return projects;
      } catch (err: any) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects",
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setInitialFetchAttempted, setProjects, setProjectCache],
  );

  // Prefetch projects for background loading (populates cache only)
  const prefetchProjects = useCallback(
    async (orgId: string) => {
      if (projectCache[orgId]) return;

      try {
        const projects = await apiGet<Project[]>(
          `${API_URL}/organizations/${orgId}/projects`,
        );
        setProjectCache((prev) => ({ ...prev, [orgId]: projects }));
      } catch (err) {
        console.error(`Failed to prefetch projects for org ${orgId}`, err);
      }
    },
    [projectCache, setProjectCache],
  );

  // Create a new project under an organization
  const createProject = useCallback(
    async (orgId: string, data: any): Promise<Project | null> => {
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
        setError(
          err instanceof Error ? err.message : "Failed to create project",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projects, setLoading, setProjects],
  );

  // Update a project
  const updateProject = useCallback(
    async (projectId: string, data: any): Promise<Project | null> => {
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
        setError(
          err instanceof Error ? err.message : "Failed to update project",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projects, setLoading, setProjects],
  );

  // Delete a project
  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiDelete(`${API_URL}/projects/${projectId}`);
        setProjects(projects.filter((p) => p.id !== projectId));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete project",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [projects, setLoading, setProjects],
  );

  return useMemo(
    () => ({
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
      initialFetchAttempted,
      prefetchProjects,
    }),
    [
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
      initialFetchAttempted,
      prefetchProjects,
    ],
  );
};
