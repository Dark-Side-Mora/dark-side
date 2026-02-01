"use client";
import { useState, useCallback, useMemo } from "react";
import { apiGet, apiPost, apiDelete } from "../api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useLearning() {
  const [modules, setModules] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch modules with quizzes
  const fetchModules = useCallback(async () => {
    if (fetchAttempted) return;
    setLoading(true);
    setError(null);
    setFetchAttempted(true);
    try {
      const url = `${API_URL}/learning/modules`;
      const result = await apiGet<any>(url);
      setModules(result.data?.modules || result.modules || []);
      return result.data || result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchAttempted]);

  // Fetch quiz details by quizId
  const fetchQuizById = useCallback(async (quizId: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/learning/quiz/${quizId}`;
      const result = await apiGet<any>(url);
      setSelectedQuiz(result.data || result);
      return result.data || result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user progress (submit answer)
  const updateUserProgress = useCallback(
    async (answer: { questionId: number; selectedIndex: number }) => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/learning/progress`;
        const result = await apiPost<any>(url, answer);
        return result;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get user progress summary
  const fetchUserProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/learning/progress`;
      const result = await apiGet<any>(url);
      setUserProgress(result.data || result);
      return result.data || result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset user progress (re-attempt)
  const resetUserProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/learning/progress`;
      const result = await apiDelete<any>(url);
      setUserProgress(null);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({
      modules,
      selectedQuiz,
      loading,
      error,
      userProgress,
      fetchModules,
      fetchQuizById,
      updateUserProgress,
      fetchUserProgress,
      resetUserProgress,
      setModules,
      setSelectedQuiz,
    }),
    [
      modules,
      selectedQuiz,
      loading,
      error,
      userProgress,
      fetchModules,
      fetchQuizById,
      updateUserProgress,
      fetchUserProgress,
      resetUserProgress,
      setModules,
      setSelectedQuiz,
    ],
  );
}
