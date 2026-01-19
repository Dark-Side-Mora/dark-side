export interface SubmitAnswerDto {
  questionId: string;
  submittedCode?: string; // For workflow-fix type
  submittedChoice?: number; // For multiple-choice type (0-based index)
  submittedText?: string; // For short-answer type
}

export interface CheckAnswersDto {
  answers: SubmitAnswerDto[];
}

export interface AnswerCheckResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string; // Show explanation after checking
}

export interface CheckAnswersResponseDto {
  quizId: string;
  results: AnswerCheckResult[];
  totalMarks: number;
  totalPossibleMarks: number;
  percentage: number;
  status: string; // 'completed', 'partial'
  message: string;
}
