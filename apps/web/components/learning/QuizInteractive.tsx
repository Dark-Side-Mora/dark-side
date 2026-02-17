import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";

interface Question {
  id: number;
  type: string;
  question: string;
  choices: string[];
  correctIndex: number;
  points: number;
  workflowCode?: string;
  hint?: string;
  userAnswer?: number | null;
  isCorrect?: boolean;
}

interface QuizInteractiveProps {
  questions: Question[];
  onAnswerSubmit: (
    questionId: number,
    selectedIndex: number,
  ) => Promise<{ isCorrect: boolean }>;
  onComplete: () => void;
}

export const QuizInteractive: React.FC<QuizInteractiveProps> = ({
  questions,
  onAnswerSubmit,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  const currentQuestion = localQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === localQuestions.length - 1;

  const handleSelect = (index: number) => {
    if (currentQuestion.isCorrect !== undefined) return; // Already answered
    setSelectedAnswer(index);
    setFeedback(null);
  };

  const handleCheck = async () => {
    if (selectedAnswer === null) return;

    setIsChecking(true);
    try {
      const result = await onAnswerSubmit(currentQuestion.id, selectedAnswer);

      setLocalQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentQuestionIndex
            ? { ...q, isCorrect: result.isCorrect, userAnswer: selectedAnswer }
            : q,
        ),
      );

      if (result.isCorrect) {
        setFeedback({
          type: "success",
          message: "Correct! + " + currentQuestion.points + " XP",
        });
      } else {
        setFeedback({ type: "error", message: "Incorrect. Try again." });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "Failed to submit answer. Please try again.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setFeedback(null);
    }
  };

  if (!currentQuestion) return <div>No questions available.</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Progress Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "18px" }}>
          Question {currentQuestionIndex + 1} of {localQuestions.length}
        </h3>
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            height: "8px",
            width: "200px",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((currentQuestionIndex + 1) / localQuestions.length) * 100}%`,
              background: "var(--accent-cyan)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Question Text */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "24px",
            lineHeight: "1.5",
          }}
        >
          {currentQuestion.question}
        </h2>

        {/* Code Block for Workflow Challenges */}
        {currentQuestion.workflowCode && (
          <pre
            style={{
              background: "#1e1e1e",
              padding: "16px",
              borderRadius: "8px",
              overflowX: "auto",
              marginBottom: "24px",
              fontSize: "14px",
              fontFamily: "monospace",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {currentQuestion.workflowCode
              .replace(/{NEWLINE}/g, "\n")
              .replace(/{TAB}/g, "  ")}
          </pre>
        )}

        {/* Choices */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {currentQuestion.choices.map((choice, index) => {
            let borderColor = "var(--border)";
            let bgColor = "rgba(255,255,255,0.02)";

            if (currentQuestion.isCorrect !== undefined) {
              if (index === currentQuestion.correctIndex) {
                borderColor = "var(--success)";
                bgColor = "rgba(34, 197, 94, 0.1)";
              } else if (
                index === currentQuestion.userAnswer &&
                !currentQuestion.isCorrect
              ) {
                borderColor = "var(--error)";
                bgColor = "rgba(239, 68, 68, 0.1)";
              }
            } else if (selectedAnswer === index) {
              borderColor = "var(--accent-cyan)";
              bgColor = "rgba(6, 182, 212, 0.1)";
            }

            return (
              <div
                key={index}
                onClick={() => handleSelect(index)}
                style={{
                  padding: "16px 20px",
                  border: `2px solid ${borderColor}`,
                  borderRadius: "12px",
                  backgroundColor: bgColor,
                  cursor:
                    currentQuestion.isCorrect !== undefined
                      ? "default"
                      : "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "15px",
                  fontWeight: 500,
                }}
              >
                {choice}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {feedback && (
              <div
                style={{
                  color:
                    feedback.type === "success"
                      ? "var(--success)"
                      : "var(--error)",
                  fontWeight: 600,
                  fontSize: "15px",
                }}
              >
                {feedback.message}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {currentQuestion.isCorrect === undefined ? (
              <Button
                onClick={handleCheck}
                disabled={selectedAnswer === null || isChecking}
                style={{ minWidth: "120px" }}
              >
                {isChecking ? "Checking..." : "Check Answer"}
              </Button>
            ) : (
              <Button onClick={handleNext} style={{ minWidth: "120px" }}>
                {isLastQuestion ? "Finish Quiz" : "Next Question"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
