"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { useProjectContext, Project } from "./ProjectContext";
import { useOrganization } from "../organization/useOrganization";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const useProject = () => {
  const [error, setError] = useState<string | null>(null);
  const { currentOrgId: globalCurrentOrgId } = useOrganization();
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

  // Sync cache to ref to avoid effect dependencies
  const cacheRef = useRef(projectCache);
  useMemo(() => {
    cacheRef.current = projectCache;
  }, [projectCache]);

  // Track the truly global current org ID to prevent background tasks from hijacking the UI
  const globalOrgIdRef = useRef(globalCurrentOrgId);
  useMemo(() => {
    globalOrgIdRef.current = globalCurrentOrgId;
  }, [globalCurrentOrgId]);

  // Race condition guards
  const activeOrgIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch projects for an organization
  const fetchProjects = useCallback(
    async (orgId: string): Promise<Project[]> => {
      // 0. Global Guard: If this fetch is NOT for the currently active organization,
      // and we're not in the middle of a switch, ignore it.
      // (Except on initial load where globalCurrentOrgId might be null)
      if (globalOrgIdRef.current && orgId !== globalOrgIdRef.current) {
        console.log(
          `[useProject] Rejecting stale fetch for org ${orgId} (current: ${globalOrgIdRef.current})`,
        );
        return [];
      }

      // 1. Atomic Update: Mark this as the latest active request
      activeOrgIdRef.current = orgId;

      // 2. Abort previous request if it's still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 3. Stale-While-Revalidate: Sync UI state immediately with cache (or empty list)
      const cached = cacheRef.current[orgId];
      setProjects(cached || []);

      if (!cached) {
        setLoading(true);
      }

      setError(null);
      setInitialFetchAttempted(true);
      try {
        // 4. Fetch with cancellation support
        const projects = await apiGet<Project[]>(
          `${API_URL}/organizations/${orgId}/projects`,
          { signal: controller.signal },
        );

        // 5. Atomic Guard: Only update if this is STILL the latest request
        // AND it still matches the globally selected organization
        if (
          activeOrgIdRef.current === orgId &&
          orgId === globalOrgIdRef.current
        ) {
          setProjects(projects);
          setProjectCache((prev) => ({ ...prev, [orgId]: projects }));
          return projects;
        } else {
          console.log(
            `[useProject] Ignoring stale response for org ${orgId} (current global: ${globalOrgIdRef.current})`,
          );
          return [];
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log(`[useProject] Request for org ${orgId} aborted`);
          return [];
        }

        // Only set error if this is still the active request
        if (activeOrgIdRef.current === orgId) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch projects",
          );
        }
        return [];
      } finally {
        if (activeOrgIdRef.current === orgId) {
          setLoading(false);
        }
      }
    },
    [setLoading, setInitialFetchAttempted, setProjects, setProjectCache],
  );

  // Prefetch projects for background loading (populates cache only)
  const prefetchProjects = useCallback(
    async (orgId: string) => {
      // If already cached, skip
      if (cacheRef.current[orgId]) return;

      try {
        const projects = await apiGet<Project[]>(
          `${API_URL}/organizations/${orgId}/projects`,
        );
        setProjectCache((prev) => ({ ...prev, [orgId]: projects }));
      } catch (err) {
        console.error(`Failed to prefetch projects for org ${orgId}`, err);
      }
    },
    [setProjectCache],
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
