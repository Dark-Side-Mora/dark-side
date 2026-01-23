// DTO for submitting an answer
export interface SubmitAnswerDto {
  questionId: number;
  selectedIndex: number;
}

// DTO for update progress response
export interface UpdateProgressResponseDto {
  questionId: number;
  isCorrect: boolean;
  mark: number;
  correctIndex: number;
}

// DTO for user progress summary
export interface UserQuizProgressDto {
  questionId: number;
  quizId: number;
  mark: number;
  isCorrect: boolean;
}

export interface UserProgressSummaryDto {
  userId: string;
  totalQuestions: number;
  totalMarks: number;
  byCourse: Array<{ courseModuleId: number; marks: number; questions: number }>;
  byQuiz: Array<{ quizId: number; marks: number; questions: number }>;
  questions: UserQuizProgressDto[];
}
