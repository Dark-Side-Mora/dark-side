"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLearning } from "../../lib/learning/useLearning";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Input";

export default function LearningPage() {
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [securityPulseScore, setSecurityPulseScore] = useState(0); // Example static score
  const [userProgress, setUserProgress] = useState<any>(null);
  const [workflowModal, setWorkflowModal] = useState<{
    open: boolean;
    question: any | null;
  }>({ open: false, question: null });
  const [workflowSelectedAnswer, setWorkflowSelectedAnswer] = useState<
    Map<number, number>
  >(new Map());
  const [workflowChecked, setWorkflowChecked] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [workflowCorrect, setWorkflowCorrect] = useState<Map<number, boolean>>(
    new Map(),
  );
  // Handler for starting workflow fix

  const handleStartWorkflowFix = (q: any) => {
    setWorkflowModal({ open: true, question: q });
  };

  // Handler for closing workflow modal
  const handleCloseWorkflowModal = () => {
    setWorkflowModal({ open: false, question: null });
  };
  const rank =
    progressPercent >= 80
      ? "Mastery"
      : progressPercent >= 50
        ? "Intermediate"
        : "Beginner";
  const rankDescription =
    progressPercent >= 80
      ? "Level 4 Engineer"
      : progressPercent >= 50
        ? "Level 2 Engineer"
        : "Newcomer";

  type Module = {
    id: number;
    title: string;
    icon?: React.ReactNode;
    length?: string;
    status?: string;
    quizzes?: any[];
  };

  const {
    modules,
    selectedQuiz,
    loading,
    error,
    fetchModules,
    fetchQuizById,
    setSelectedQuiz,
    updateUserProgress,
    fetchUserProgress,
  }: {
    modules: Module[];
    selectedQuiz: any;
    loading: boolean;
    error: string | null;
    fetchModules: () => void;
    fetchQuizById: (id: number) => void;
    setSelectedQuiz: (quiz: any) => void;
    updateUserProgress: (answer: {
      questionId: number;
      selectedIndex: number;
    }) => Promise<any>;
    fetchUserProgress: () => Promise<any>;
  } = useLearning();

  // Helper to fetch and set user progress
  const fetchAndSetUserProgress = useCallback(async () => {
    try {
      const progress = await fetchUserProgress();
      setUserProgress(progress);
      // Set progress percent for the progress bar
      if (progress && progress.totalQuestions > 0) {
        const correctCount = progress.questions.filter(
          (q: any) => q.isCorrect,
        ).length;
        setProgressPercent(
          Math.round((correctCount / progress.totalQuestions) * 100),
        );
      } else {
        setProgressPercent(0);
      }
      // set total number of questions as security pulse score for demo
      setSecurityPulseScore(progress ? progress.totalQuestions * 1.5 : 0);
    } catch (e) {
      setUserProgress(null);
      setProgressPercent(0);
    }
  }, [fetchUserProgress]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    fetchAndSetUserProgress();
  }, [fetchAndSetUserProgress]);

  useEffect(() => {
    if (modules.length > 0 && activeModuleId === null && modules[0]) {
      setActiveModuleId(modules[0].id);
      setActiveModule(modules[0].title);
    }
  }, [modules, activeModuleId]);

  useEffect(() => {
    // Reset question state when quiz changes
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setAnswerChecked(false);
    setAnswerCorrect(null);
    setShowNext(false);
  }, [selectedQuiz]);

  // Handler for selecting a course/module
  const handleSelectModule = (mod: any) => {
    setActiveModuleId(mod.id);
    setActiveModule(mod.title);
    setSelectedQuiz(null);
  };

  // Handler for selecting a quiz
  const handleSelectQuiz = (quizId: number) => {
    fetchQuizById(quizId);
  };

  // Handler for selecting an answer
  const handleSelectAnswer = (answerIndex: number) => {
    if (!answerChecked) setSelectedAnswer(answerIndex);
  };

  // Handler for checking the answer
  const handleCheckAnswer = async () => {
    if (!selectedQuiz || !selectedQuiz.questions) return;
    const question = selectedQuiz.questions[currentQuestionIdx];
    if (selectedAnswer === null) return;
    setChecking(true);
    try {
      const result = await updateUserProgress({
        questionId: question.id,
        selectedIndex: selectedAnswer,
      });
      setAnswerCorrect(result.isCorrect);
      setAnswerChecked(true);
      // Refetch and update user progress
      await fetchAndSetUserProgress();
      const updated = await fetchUserProgress();
      const qProgress = updated?.questions?.find(
        (q: any) => q.questionId === question.id,
      );
      const isLast = currentQuestionIdx === selectedQuiz.questions.length - 1;
      if (isLast && qProgress && qProgress.isCorrect) {
        setShowNext(false);
        setTimeout(() => setShowCompletion(true), 400);
      } else {
        setShowNext(qProgress && qProgress.isCorrect);
      }
      setChecking(false);
    } catch (e) {
      setChecking(false);
    }
  };

  const handleWorkflowSelectAnswer = (
    qId: number,
    idx: number,
    isCompleted: boolean,
  ) => {
    if (isCompleted || workflowChecked.get(qId)) return;
    setWorkflowSelectedAnswer((prev) => new Map(prev).set(qId, idx));
  };

  const handleWorkflowCheck = async (q: any) => {
    const selectedIdx = workflowSelectedAnswer.get(q.id);
    if (selectedIdx === undefined || selectedIdx === null) return;
    try {
      const result = await updateUserProgress({
        questionId: q.id,
        selectedIndex: selectedIdx,
      });
      setWorkflowChecked((prev) => new Map(prev).set(q.id, true));
      setWorkflowCorrect((prev) => new Map(prev).set(q.id, result.isCorrect));
      await fetchAndSetUserProgress();
    } catch (e) {}
  };

  // Handler for next question
  const handleNext = () => {
    if (!selectedQuiz || !selectedQuiz.questions) return;
    if (currentQuestionIdx < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
      setAnswerChecked(false);
      setAnswerCorrect(null);
      setShowNext(false);
    } else {
      setShowCompletion(true);
    }
  };

  // Handler for previous question
  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
      setSelectedAnswer(null);
      setAnswerChecked(false);
      setAnswerCorrect(null);
      setShowNext(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="learning-grid">
        <style jsx>{`
          .learning-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 32px;
          }
          @media (max-width: 1024px) {
            .learning-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
        {/* Main Area: Quiz and Details */}
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}
            >
              Interactive Learning Hub
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Master DevOps through hands-on labs. Practice "Shift Left"
              security with CI‑Insight.
            </p>
          </div>

          {/* Show selected quiz details or prompt to select a module/quiz */}
          {selectedQuiz ? (
            <Card
              style={{ padding: "32px", border: "1px solid var(--border)" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    borderLeft: "4px solid var(--accent-cyan)",
                    paddingLeft: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    {selectedQuiz.name}
                  </h4>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      lineHeight: "1.7",
                      fontSize: "15px",
                    }}
                  >
                    {selectedQuiz.description}
                  </p>
                </div>
                {selectedQuiz.questions &&
                  selectedQuiz.questions.length > 0 && (
                    <>
                      {/* Multiple Choice Section */}
                      <div
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          padding: "24px",
                          borderRadius: "16px",
                          border: "1px solid var(--border)",
                          marginBottom: 32,
                        }}
                      >
                        <h5
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "var(--accent-cyan)",
                          }}
                        >
                          KNOWLEDGE CHECK
                        </h5>
                        {/* Show only one multiple choice question at a time */}
                        {(() => {
                          const mcQuestions = selectedQuiz.questions.filter(
                            (q: any) => q.type !== "workflow-fix",
                          );
                          if (mcQuestions.length === 0)
                            return <div>No multiple choice questions.</div>;
                          const q =
                            mcQuestions[currentQuestionIdx] || mcQuestions[0];
                          // Find user progress for this question
                          const qProgress = userProgress?.questions?.find(
                            (qp: any) => qp.questionId === q.id,
                          );
                          const isCompleted = qProgress;
                          return (
                            <div key={q.id} style={{ marginBottom: "20px" }}>
                              <p
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  marginBottom: "12px",
                                }}
                              >
                                {q.question}
                              </p>
                              {q.choices && q.choices.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                  }}
                                >
                                  {q.choices.map((opt: string, i: number) => {
                                    let bg = "transparent";
                                    let color;
                                    let border = "1px solid var(--border)";
                                    if (
                                      isCompleted &&
                                      qProgress.correctIndex === i
                                    ) {
                                      bg = "var(--success)";
                                      color = "white";
                                      border = "2.5px solid #22c55e";
                                    } else if (selectedAnswer === i) {
                                      if (answerChecked) {
                                        if (
                                          answerCorrect &&
                                          q.correctIndex === i
                                        ) {
                                          bg = "var(--success)";
                                        } else if (!answerCorrect) {
                                          bg = "var(--error)";
                                          color = "white";
                                        } else {
                                          bg = "var(--accent-cyan)";
                                        }
                                      } else {
                                        bg = "var(--accent-cyan)";
                                      }
                                    }
                                    return (
                                      <div
                                        key={i}
                                        onClick={() => {
                                          if (!isCompleted && !answerChecked)
                                            handleSelectAnswer(i);
                                        }}
                                        style={{
                                          padding: "16px",
                                          borderRadius: "12px",
                                          border,
                                          fontSize: "14px",
                                          cursor:
                                            isCompleted || answerChecked
                                              ? "not-allowed"
                                              : "pointer",
                                          backgroundColor: bg,
                                          color,
                                          transition: "all 0.2s ease",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          opacity:
                                            (answerChecked &&
                                              selectedAnswer !== i) ||
                                            (isCompleted &&
                                              q.correctIndex !== i)
                                              ? 0.7
                                              : 1,
                                        }}
                                      >
                                        <span>{opt}</span>
                                        {(answerChecked &&
                                          selectedAnswer === i &&
                                          answerCorrect &&
                                          q.correctIndex === i) ||
                                        (isCompleted &&
                                          q.correctIndex === i) ? (
                                          <span
                                            style={{
                                              color: "var(--success)",
                                              marginLeft: 8,
                                            }}
                                          >
                                            ✔
                                          </span>
                                        ) : null}
                                        {answerChecked &&
                                        selectedAnswer === i &&
                                        !answerCorrect ? (
                                          <span
                                            style={{
                                              color: "var(--error)",
                                              marginLeft: 8,
                                            }}
                                          >
                                            ✖
                                          </span>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {/* Check/Next/Prev buttons */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  marginTop: "24px",
                                }}
                              >
                                <Button
                                  onClick={handlePrev}
                                  disabled={currentQuestionIdx === 0}
                                  style={{ minWidth: 90 }}
                                  variant="secondary"
                                >
                                  Previous
                                </Button>
                                {!answerChecked && !isCompleted && (
                                  <Button
                                    onClick={handleCheckAnswer}
                                    disabled={
                                      selectedAnswer === null || checking
                                    }
                                    style={{ minWidth: 90 }}
                                  >
                                    {checking ? "Checking..." : "Check"}
                                  </Button>
                                )}
                                {qProgress && (
                                  <Button
                                    onClick={handleNext}
                                    disabled={
                                      currentQuestionIdx ===
                                      mcQuestions.length - 1
                                    }
                                    style={{ minWidth: 90 }}
                                  >
                                    Next
                                  </Button>
                                )}
                              </div>
                              {/* Feedback message */}
                              {answerChecked && (
                                <div
                                  style={{
                                    marginTop: 16,
                                    color: answerCorrect
                                      ? "var(--success)"
                                      : "var(--error)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {answerCorrect
                                    ? "Correct! Progress updated."
                                    : "Incorrect. Please try again or go back."}
                                </div>
                              )}
                              {/* Show user progress for this question */}
                              {qProgress && (
                                <div
                                  style={{
                                    marginTop: 8,
                                    fontSize: 13,
                                    color: qProgress.isCorrect
                                      ? "var(--success)"
                                      : "var(--error)",
                                  }}
                                >
                                  {qProgress.isCorrect
                                    ? "You have answered this question correctly."
                                    : "You have not answered this question correctly yet."}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {/* Completion Popup */}
                        {showCompletion && (
                          <div
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              width: "100vw",
                              height: "100vh",
                              background: "rgba(0,0,0,0.35)",
                              zIndex: 1000,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                background: "white",
                                borderRadius: 16,
                                padding: "48px 32px",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                                minWidth: 320,
                                textAlign: "center",
                              }}
                            >
                              <h2
                                style={{
                                  color: "var(--accent-cyan)",
                                  fontWeight: 800,
                                  marginBottom: 16,
                                }}
                              >
                                Quiz Completed!
                              </h2>
                              <div
                                style={{
                                  color: "var(--text-secondary)",
                                  fontSize: 16,
                                  marginBottom: 24,
                                }}
                              >
                                Congratulations! You have completed all
                                questions in this quiz.
                              </div>
                              <Button
                                onClick={() => setShowCompletion(false)}
                                style={{ minWidth: 120 }}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Workflow Section */}
                      {selectedQuiz.questions.some(
                        (q: any) => q.type === "workflow-fix",
                      ) && (
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            padding: "24px",
                            borderRadius: "16px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <h5
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "var(--accent-cyan)",
                            }}
                          >
                            WORKFLOW FIX CHALLENGES
                          </h5>
                          {selectedQuiz.questions
                            .filter((q: any) => q.type === "workflow-fix")
                            .map((q: any, idx: number) => {
                              // Find user progress for this workflow question
                              const qProgress = userProgress?.questions?.find(
                                (qp: any) => qp.questionId === q.id,
                              );
                              const isMarked = !!qProgress;
                              const isCompleted =
                                qProgress && qProgress.isCorrect;
                              const checked =
                                workflowChecked.get(q.id) || isCompleted;
                              const correct = isCompleted
                                ? true
                                : workflowCorrect.get(q.id);
                              const selectedIdx = workflowSelectedAnswer.get(
                                q.id,
                              );
                              return (
                                <div
                                  key={q.id}
                                  style={{
                                    marginBottom: "24px",
                                    padding: "16px",
                                    border: "1px solid var(--border)",
                                    borderRadius: "12px",
                                    background: "rgba(0,0,0,0.03)",
                                  }}
                                >
                                  <div
                                    style={{ fontWeight: 600, marginBottom: 8 }}
                                  >
                                    Workflow Challenge {idx + 1}
                                  </div>
                                  <div style={{ marginBottom: 8 }}>
                                    {q.question}
                                  </div>
                                  {q.hint && (
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        marginBottom: 8,
                                      }}
                                    >
                                      Hint: {q.hint}
                                    </div>
                                  )}
                                  {q.workflowCode && (
                                    <pre
                                      style={{
                                        background: "var(--border)",
                                        padding: 12,
                                        borderRadius: 8,
                                        fontSize: 13,
                                        marginBottom: 16,
                                      }}
                                    >
                                      {q.workflowCode
                                        .replace(/{NEWLINE}/g, "\n")
                                        .replace(/{TAB}/g, "\t")}
                                    </pre>
                                  )}
                                  {q.choices && q.choices.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                      }}
                                    >
                                      {q.choices.map(
                                        (opt: string, i: number) => {
                                          let bg = "transparent";
                                          let color;
                                          let border =
                                            "1px solid var(--border)";
                                          // Always show correct answer if marked (in user progress), or after check
                                          const showCorrect =
                                            (checked && q.correctIndex === i) ||
                                            (isMarked && q.correctIndex === i);
                                          if (showCorrect) {
                                            bg = "var(--success)";
                                            color = "white";
                                            border = "2.5px solid #22c55e";
                                          } else if (
                                            selectedIdx === i &&
                                            !checked &&
                                            !isMarked
                                          ) {
                                            bg = "var(--accent-cyan)";
                                          }
                                          return (
                                            <div
                                              key={i}
                                              onClick={() => {
                                                if (!isMarked && !checked)
                                                  handleWorkflowSelectAnswer(
                                                    q.id,
                                                    i,
                                                    isCompleted,
                                                  );
                                              }}
                                              style={{
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border,
                                                fontSize: "13px",
                                                backgroundColor: bg,
                                                color,
                                                transition: "all 0.2s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                opacity:
                                                  (checked || isMarked) &&
                                                  userProgress?.questions?.find(
                                                    (qp: any) =>
                                                      qp.questionId === q.id,
                                                  )?.correctIndex !== i
                                                    ? 0.7
                                                    : 1,
                                                cursor:
                                                  checked || isMarked
                                                    ? "not-allowed"
                                                    : "pointer",
                                              }}
                                            >
                                              <span>{opt}</span>
                                              {/* Show check/cross icon if checked or completed or marked */}
                                              {(checked &&
                                                userProgress?.questions?.find(
                                                  (qp: any) =>
                                                    qp.questionId === q.id,
                                                )?.correctIndex === i) ||
                                              (isMarked &&
                                                userProgress?.questions?.find(
                                                  (qp: any) =>
                                                    qp.questionId === q.id,
                                                )?.correctIndex === i) ? (
                                                <span
                                                  style={{
                                                    color: "var(--success)",
                                                    marginLeft: 8,
                                                  }}
                                                >
                                                  ✔
                                                </span>
                                              ) : null}
                                              {checked &&
                                              selectedIdx === i &&
                                              q.correctIndex !== i ? (
                                                <span
                                                  style={{
                                                    color: "var(--error)",
                                                    marginLeft: 8,
                                                  }}
                                                >
                                                  ✖
                                                </span>
                                              ) : null}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                                  {/* Check button and feedback */}
                                  {!checked && !isMarked && (
                                    <Button
                                      style={{ minWidth: 120, marginTop: 12 }}
                                      onClick={() => handleWorkflowCheck(q)}
                                      disabled={
                                        selectedIdx === undefined ||
                                        selectedIdx === null
                                      }
                                    >
                                      Check
                                    </Button>
                                  )}
                                  {checked && (
                                    <div
                                      style={{
                                        marginTop: 12,
                                        color: correct
                                          ? "var(--success)"
                                          : "var(--error)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {correct
                                        ? "Correct! Progress updated."
                                        : "Incorrect. Please try again or review the correct answer."}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </>
                  )}
              </div>
            </Card>
          ) : (
            <Card
              style={{ padding: "32px", border: "1px solid var(--border)" }}
            >
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "16px",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                Select a module and quiz from the right to get started!
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Modules and Progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card title="Module Progression">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{ position: "relative", width: "80px", height: "80px" }}
              >
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth="8"
                    strokeDasharray="263.8"
                    strokeDashoffset={263.8 - (263.8 * progressPercent) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "18px",
                    fontWeight: 900,
                  }}
                >
                  {progressPercent}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>{rank}</div>
                <div
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  {rankDescription}
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ fontSize: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    Security Pulse Score
                  </span>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>
                    {securityPulseScore} XP
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "2px",
                  }}
                >
                  <div
                    style={{
                      width: `${securityPulseScore}%`,
                      height: "100%",
                      backgroundColor: "var(--success)",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card title="Course Syllabus">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {loading && <div>Loading modules...</div>}
              {error && <div style={{ color: "var(--error)" }}>{error}</div>}
              {modules.map((mod: any) => (
                <div
                  key={mod.id}
                  onClick={() => handleSelectModule(mod)}
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    backgroundColor:
                      activeModuleId === mod.id
                        ? "rgba(255, 255, 255, 0.03)"
                        : "transparent",
                    borderColor:
                      activeModuleId === mod.id
                        ? "var(--accent-cyan)"
                        : "var(--border)",
                    transition: "all 0.2s",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{mod.icon}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700 }}>
                      {mod.title}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {mod.length}
                    </span>
                    <span
                      style={{
                        color:
                          mod.status === "Available"
                            ? "var(--success)"
                            : mod.status === "Paused"
                              ? "var(--warning)"
                              : "var(--text-secondary)",
                        fontWeight: 800,
                      }}
                    >
                      {mod.status?.toUpperCase()}
                    </span>
                  </div>
                  {/* Show quizzes as tiny cards if this module is selected */}
                  {activeModuleId === mod.id &&
                    mod.quizzes &&
                    mod.quizzes.length > 0 && (
                      <div
                        style={{
                          marginTop: "18px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        {mod.quizzes.map((quiz: any) => (
                          <div
                            key={quiz.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectQuiz(quiz.id);
                            }}
                            style={{
                              minWidth: "120px",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid var(--border)",
                              backgroundColor:
                                selectedQuiz && selectedQuiz.id === quiz.id
                                  ? "var(--accent-cyan)"
                                  : "rgba(255,255,255,0.01)",
                              color:
                                selectedQuiz && selectedQuiz.id === quiz.id
                                  ? "white"
                                  : "inherit",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 600,
                              boxShadow:
                                selectedQuiz && selectedQuiz.id === quiz.id
                                  ? "0 2px 8px rgba(6,182,212,0.15)"
                                  : "none",
                              transition: "all 0.2s",
                            }}
                          >
                            <div>{quiz.name}</div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                marginTop: "4px",
                              }}
                            >
                              {quiz.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <p>Learning resources content coming soon...</p>
    </div>
  );
}
