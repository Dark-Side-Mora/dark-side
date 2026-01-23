export interface LoadQuizzesQuery {
  category?: string;
  difficulty?: string;
  type?: string;
  userId?: string;
}

export interface QuizQuestionDto {
  id: number;
  type: string;
  question: string;
  choices: string[];
  correctIndex?: number; // Only for admin or after answer
  points: number;
  workflowCode?: string;
  hint?: string;
}

export interface QuizDto {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  questions: QuizQuestionDto[];
}

export interface QuizProgressDto {
  quizId: number;
  status: string; // 'not-started', 'in-progress', 'completed'
  progress: number; // Percentage
  marks: number;
  totalMarks: number;
  currentQuestion?: number;
  attemptCount: number;
  completedAt?: string;
}

export interface LoadQuizzesResponseDto {
  quizzes: QuizDto[];
  progress?: { [quizId: number]: QuizProgressDto };
}
