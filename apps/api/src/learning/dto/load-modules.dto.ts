export interface CourseModuleDto {
  id: number;
  title: string;
  status: string;
  length: string;
  icon: string;
  order: number;
}

export interface LoadModulesResponseDto {
  modules: CourseModuleDto[];
}

// DTO for module with quizzes (no questions)
export interface QuizSummaryDto {
  id: number;
  name: string;
  description: string;
  difficulty: string;
}

export interface CourseModuleWithQuizzesDto {
  id: number;
  title: string;
  status: string;
  length: string;
  icon: string;
  order: number;
  quizzes: QuizSummaryDto[];
}

export interface LoadModulesWithQuizzesResponseDto {
  modules: CourseModuleWithQuizzesDto[];
}
