"use client";

import { useState, useEffect } from "react";
import styles from "./learning-test.module.css";

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  type: string;
  totalQuestions: number;
  estimatedTime: number;
  tags: string[];
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  order: number;
  title: string;
  description: string;
  type: string;
  vulnerableCode?: string;
  codeLanguage?: string;
  choices?: string[];
  hint: string;
  explanation: string;
  points: number;
  answer?: QuizAnswer;
}

interface QuizAnswer {
  id: string;
  correctCode?: string;
  correctChoice?: number;
  acceptableAnswers?: string[];
}

interface UserAnswer {
  questionId: string;
  answer: string | number;
}

export default function LearningTestPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userId] = useState(() => {
    // Generate or retrieve a test userId
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("testUserId");
      if (!id) {
        id = "test-user-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("testUserId", id);
      }
      return id;
    }
    return "test-user-default";
  });

  // Fetch quizzes on mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/learning/quizzes");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      const result = await response.json();

      // Handle the API response structure: { statusCode, message, data: { quizzes: [] } }
      const quizzesData =
        result?.data?.quizzes || result?.quizzes || result?.data || [];

      if (!Array.isArray(quizzesData)) {
        console.error("Invalid response structure:", result);
        throw new Error("Invalid response format");
      }

      setQuizzes(quizzesData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const selectQuiz = async (quiz: Quiz) => {
    try {
      // Initialize the quiz for the user
      const response = await fetch(
        `http://localhost:3000/learning/quizzes/${quiz.id}/start?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        setError(error?.message || "Failed to start quiz");
        return;
      }

      setSelectedQuiz(quiz);
      setUserAnswers([]);
      setResults(null);
      setCurrentQuestionIndex(0);
      setError(null);
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setUserAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      if (existing >= 0) {
        return [
          ...prev.slice(0, existing),
          { questionId, answer },
          ...prev.slice(existing + 1),
        ];
      }
      return [...prev, { questionId, answer }];
    });
  };

  const submitAnswers = async () => {
    if (!selectedQuiz) return;

    try {
      setSubmitting(true);

      // Format answers based on question type
      const answers = userAnswers
        .map((ua) => {
          const question = selectedQuiz.questions.find(
            (q) => q.id === ua.questionId,
          );

          if (!question) return null;

          const answer: any = {
            questionId: ua.questionId,
          };

          // Map the answer to the correct field based on question type
          if (question.type === "workflow-fix") {
            answer.submittedCode = ua.answer;
          } else if (question.type === "multiple-choice") {
            answer.submittedChoice = ua.answer;
          } else if (question.type === "short-answer") {
            answer.submittedText = ua.answer;
          }

          return answer;
        })
        .filter(Boolean);

      console.log("Submitting answers:", { quizId: selectedQuiz.id, answers });

      const response = await fetch(
        `http://localhost:3000/learning/quizzes/${selectedQuiz.id}/check-answers?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        },
      );

      console.log("Response status:", response.status, response.statusText);
      console.log("Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      let result: any = {};
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse JSON:", e);
        }
      }

      console.log("Parsed result:", result);

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: result,
          rawText: responseText,
        });
        throw new Error(
          result?.message ||
            `Failed to submit answers (Status: ${response.status})`,
        );
      }

      // Handle the API response structure: { statusCode, message, data: { ... } }
      const resultsData = result?.data || result;

      // Create a map of user answers for lookup
      const userAnswersMap = new Map(
        userAnswers.map((ua) => [ua.questionId, ua.answer]),
      );

      // Transform API response to match frontend expectations
      const transformedResults = {
        correctAnswers:
          resultsData.results?.filter((r: any) => r.isCorrect).length || 0,
        totalQuestions: resultsData.results?.length || 0,
        marksObtained: resultsData.totalMarks || 0,
        totalMarks: resultsData.totalPossibleMarks || 0,
        percentage: resultsData.percentage || 0,
        questionResults:
          resultsData.results?.map((r: any) => ({
            isCorrect: r.isCorrect,
            pointsEarned: r.pointsEarned,
            explanation: r.explanation,
            userAnswer:
              userAnswersMap.get(r.questionId) || "No answer provided",
          })) || [],
      };

      setResults(transformedResults);
    } catch (err) {
      console.error("Submit error details:", err);
      setError(err instanceof Error ? err.message : "Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = async () => {
    if (!selectedQuiz) return;

    try {
      const response = await fetch(
        `http://localhost:3000/learning/quizzes/${selectedQuiz.id}/reattempt?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to reset quiz");
      setUserAnswers([]);
      setResults(null);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset quiz");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading quizzes...</div>
      </div>
    );
  }

  if (!selectedQuiz) {
    return (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Learning Platform Test</h1>
        <p className={styles.subtitle}>Select a quiz to get started</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.quizGrid}>
          {Array.isArray(quizzes) && quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <div key={quiz.id} className={styles.quizCard}>
                <div className={styles.quizHeader}>
                  <h3 className={styles.quizHeaderTitle}>{quiz.title}</h3>
                  <span
                    className={`${styles.difficulty} ${styles[quiz.difficulty]}`}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
                <p className={styles.description}>{quiz.description}</p>
                <div className={styles.metadata}>
                  <span>📚 {quiz.totalQuestions} questions</span>
                  <span>⏱️ {quiz.estimatedTime}min</span>
                  <span>🏷️ {quiz.category}</span>
                </div>
                <div className={styles.tags}>
                  {quiz.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => selectQuiz(quiz)}
                  className={styles.startButton}
                >
                  Start Quiz
                </button>
              </div>
            ))
          ) : (
            <div className={styles.error}>
              No quizzes available. Please check the API connection.
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Quiz data is invalid or incomplete.</div>
        <button
          onClick={() => setSelectedQuiz(null)}
          className={styles.backButton}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const currentAnswer = userAnswers.find(
    (a) => a.questionId === currentQuestion.id,
  );
  const progress =
    ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => setSelectedQuiz(null)}
          className={styles.backButton}
        >
          ← Back to Quizzes
        </button>
        <h1 className={styles.headerTitle}>{selectedQuiz.title}</h1>
      </div>

      {!results ? (
        <>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>
            Question {currentQuestionIndex + 1} of{" "}
            {selectedQuiz.questions.length}
          </p>

          <div className={styles.questionCard}>
            <h2 className={styles.questionCardTitle}>
              {currentQuestion.title}
            </h2>
            <p className={styles.questionDescription}>
              {currentQuestion.description}
            </p>

            {currentQuestion.type === "workflow-fix" && (
              <>
                {currentQuestion.vulnerableCode && (
                  <div className={styles.codeBlock}>
                    <p className={styles.codeLabel}>Vulnerable Code:</p>
                    <pre>
                      <code>{currentQuestion.vulnerableCode}</code>
                    </pre>
                  </div>
                )}
                <textarea
                  placeholder="Enter the fixed code here..."
                  value={(currentAnswer?.answer as string) || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  className={styles.textarea}
                />
              </>
            )}

            {currentQuestion.type === "multiple-choice" && (
              <div className={styles.choices}>
                {currentQuestion.choices?.map((choice, idx) => (
                  <label key={idx} className={styles.choiceLabel}>
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={idx}
                      checked={(currentAnswer?.answer as number) === idx}
                      onChange={() =>
                        handleAnswerChange(currentQuestion.id, idx)
                      }
                    />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === "short-answer" && (
              <input
                type="text"
                placeholder="Enter your answer..."
                value={(currentAnswer?.answer as string) || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                className={styles.input}
              />
            )}

            <div className={styles.hintSection}>
              <details>
                <summary>💡 Hint</summary>
                <p>{currentQuestion.hint}</p>
              </details>
            </div>
          </div>

          <div className={styles.navigation}>
            <button
              onClick={() =>
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
              }
              disabled={currentQuestionIndex === 0}
              className={styles.navButton}
            >
              Previous
            </button>

            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <button
                onClick={submitAnswers}
                disabled={submitting}
                className={styles.submitButton}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                className={styles.navButton}
              >
                Next
              </button>
            )}
          </div>
        </>
      ) : (
        <div className={styles.resultsCard}>
          <h2 className={styles.resultsCardTitle}>Quiz Results</h2>

          <div className={styles.scoreDisplay}>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>
                {results.correctAnswers}
              </span>
              <span className={styles.scoreLabel}>Correct</span>
            </div>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>
                {results.totalQuestions - results.correctAnswers}
              </span>
              <span className={styles.scoreLabel}>Incorrect</span>
            </div>
            <div className={styles.scoreCircle}>
              <span className={styles.scoreNumber}>
                {Math.round(
                  (results.correctAnswers / results.totalQuestions) * 100,
                )}
                %
              </span>
              <span className={styles.scoreLabel}>Score</span>
            </div>
          </div>

          <div className={styles.marksDisplay}>
            <p>
              Total Marks: <strong>{results.marksObtained}</strong> /{" "}
              {results.totalMarks}
            </p>
          </div>

          <div className={styles.detailedResults}>
            <h3 className={styles.detailedResultsTitle}>Answer Review</h3>
            {results.questionResults?.map((qr: any, idx: number) => {
              const question = selectedQuiz?.questions[idx];
              if (!question) return null;

              return (
                <div
                  key={idx}
                  className={`${styles.resultItem} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
                >
                  <div className={styles.resultQuestion}>
                    <h4 className={styles.resultQuestionTitle}>
                      {question.title}
                    </h4>
                    <span className={styles.resultStatus}>
                      {qr.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>
                  <div className={styles.resultDetails}>
                    <p>
                      <strong>Your Answer:</strong>{" "}
                      {typeof qr.userAnswer === "string"
                        ? qr.userAnswer.substring(0, 100)
                        : `Option ${qr.userAnswer}`}
                    </p>
                    {!qr.isCorrect && qr.explanation && (
                      <div className={styles.explanation}>
                        <p>
                          <strong>Explanation:</strong> {qr.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button onClick={resetQuiz} className={styles.retakeButton}>
              Retake Quiz
            </button>
            <button
              onClick={() => setSelectedQuiz(null)}
              className={styles.backButton}
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
