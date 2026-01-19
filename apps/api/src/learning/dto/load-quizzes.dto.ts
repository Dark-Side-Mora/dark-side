export interface LoadQuizzesQuery {
  category?: string;
  difficulty?: string;
  type?: string;
  userId?: string;
}

export interface QuestionDto {
  id: string;
  order: number;
  title: string;
  description: string;
  type: string; // 'workflow-fix', 'multiple-choice', 'short-answer'
  vulnerableCode?: string; // For workflow-fix type
  codeLanguage?: string;
  choices?: string[]; // For multiple-choice type
  hint?: string;
  // Note: explanation is NOT sent initially, only after quiz completion
}

export interface QuizDto {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  type: string;
  totalQuestions: number;
  estimatedTime: number;
  tags: string[];
  questions: QuestionDto[];
}

export interface QuizProgressDto {
  quizId: string;
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
  progress?: { [quizId: string]: QuizProgressDto };
}
