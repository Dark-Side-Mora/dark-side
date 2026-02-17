import React from "react";
import { Button } from "../ui/Button";
import { QuizInteractive } from "./QuizInteractive";

interface CoursePlayerProps {
  module: {
    id: number;
    title: string;
    description: string;
    quizzes: any[];
  };
  onExit: () => void;
  onQuizAnswer: (
    questionId: number,
    selectedIndex: number,
  ) => Promise<{ isCorrect: boolean }>;
  onQuizComplete: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({
  module,
  onExit,
  onQuizAnswer,
  onQuizComplete,
}) => {
  // For MVP, we assume 1 module = 1 quiz.
  // Future: Use state to switch between video/text/quiz steps.
  const activeQuiz =
    module.quizzes && module.quizzes.length > 0 ? module.quizzes[0] : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        height: "calc(100vh - 64px)", // Adjusted for standard header
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar Navigation */}
      <div
        style={{
          background: "var(--bg-card)", // Ensure this matches or is slightly distinct
          borderRight: "1px solid var(--border)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Button
          variant="secondary"
          onClick={onExit}
          style={{ marginBottom: "24px", alignSelf: "flex-start" }}
        >
          ← Back to Hub
        </Button>

        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            marginBottom: "8px",
            color: "var(--text-primary)",
          }}
        >
          Course Content
        </h3>
        <div
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            marginBottom: "24px",
          }}
        >
          {module.title}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Mock Steps for visual structure */}
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "var(--success)" }}>✔</span> Introduction
          </div>
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "var(--accent-cyan)",
              color: "#000",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>▶</span> Quiz: {activeQuiz?.name || "Knowledge Check"}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          padding: "32px",
          overflowY: "auto",
          background:
            "radial-gradient(circle at top right, rgba(6, 182, 212, 0.05), transparent 40%)",
        }}
      >
        {activeQuiz ? (
          <div>
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                {activeQuiz.name}
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                {activeQuiz.description}
              </p>
            </div>

            <QuizInteractive
              questions={activeQuiz.questions || []}
              onAnswerSubmit={onQuizAnswer}
              onComplete={onQuizComplete}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "var(--text-secondary)",
            }}
          >
            No content available for this module.
          </div>
        )}
      </div>
    </div>
  );
};
