"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLearning } from "../../lib/learning/useLearning";
import { GamificationDashboard } from "../../components/learning/GamificationDashboard";
import { CourseCatalog } from "../../components/learning/CourseCatalog";
import { CoursePlayer } from "../../components/learning/CoursePlayer";

export default function LearningPage() {
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);

  const { modules, fetchModules, updateUserProgress, fetchUserProgress } =
    useLearning();

  // Initial Data Fetch
  useEffect(() => {
    fetchModules();
    fetchUserProgress().then(setUserProgress);
  }, [fetchModules, fetchUserProgress]);

  // Handler for selecting a module
  const handleSelectModule = (moduleId: number) => {
    setActiveModuleId(moduleId);
  };

  // Handler for exiting a module
  const handleExitModule = () => {
    setActiveModuleId(null);
    fetchUserProgress().then(setUserProgress); // Refresh progress on exit
  };

  // Handler for answering a quiz question
  const handleQuizAnswer = async (
    questionId: number,
    selectedIndex: number,
  ) => {
    const result = await updateUserProgress({
      questionId,
      selectedIndex,
    });
    // Refresh progress in background to update points/rank
    fetchUserProgress().then(setUserProgress);
    return result;
  };

  // Handler for quiz completion
  const handleQuizComplete = () => {
    // improved feedback could go here
    handleExitModule();
  };

  // Find the active module object
  const activeModule = modules.find((m: any) => m.id === activeModuleId);

  return (
    <div
      className="learning-page-container"
      style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}
    >
      {/* View: Course Player */}
      {activeModuleId && activeModule ? (
        <CoursePlayer
          module={activeModule}
          onExit={handleExitModule}
          onQuizAnswer={handleQuizAnswer}
          onQuizComplete={handleQuizComplete}
        />
      ) : (
        /* View: Dashboard & Catalog */
        <>
          <div style={{ marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 800,
                marginBottom: "12px",
                background: "linear-gradient(90deg, #fff, #aaa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              DevSecOps Academy
            </h1>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px" }}>
              Level up your skills with interactive labs and quizzes. Earn XP,
              unlock badges, and climb the ranks from Novice to Architect.
            </p>
          </div>

          <GamificationDashboard userProgress={userProgress} />

          <div style={{ marginTop: "48px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              Available Courses{" "}
              <span
                style={{
                  fontSize: "14px",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                {modules.length}
              </span>
            </h2>
            <CourseCatalog
              modules={modules}
              onSelectModule={handleSelectModule}
            />
          </div>
        </>
      )}
    </div>
  );
}
