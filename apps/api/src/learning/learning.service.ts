import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoadModulesWithQuizzesResponseDto } from './dto/load-modules.dto';
import { QuizDto } from './dto/load-quizzes.dto';
import {
  SubmitAnswerDto,
  UpdateProgressResponseDto,
  UserProgressSummaryDto,
} from './dto/check-answers.dto';

const prisma = new PrismaClient();

@Injectable()
export class LearningService {
  async getModulesWithQuizzes(): Promise<LoadModulesWithQuizzesResponseDto> {
    const modules = await prisma.courseModule.findMany({
      orderBy: { order: 'asc' },
      include: {
        quizzes: true,
      },
    });
    return {
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        length: m.length,
        icon: m.icon,
        order: m.order,
        quizzes: m.quizzes.map((q) => ({
          id: q.id,
          name: q.name,
          description: q.description,
          difficulty: q.difficulty,
        })),
      })),
    };
  }

  async getQuiz(quizId: number): Promise<QuizDto> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new Error('Quiz not found');
    console.log(quiz);
    return {
      id: quiz.id,
      name: quiz.name,
      description: quiz.description,
      difficulty: quiz.difficulty,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        choices: q.choices,
        points: q.points,
        workflowCode: q.workflowCode || undefined,
        hint: q.hint || undefined,
      })),
    };
  }

  async updateUserProgress(
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<UpdateProgressResponseDto> {
    console.log(`Fetching question ${dto.questionId} for user ${userId}`);
    const question = await prisma.quizQuestion.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) {
      console.error(`Question ${dto.questionId} not found for user ${userId}`);
      throw new Error('Question not found');
    }
    const isCorrect = dto.selectedIndex === question.correctIndex;
    const mark = isCorrect ? question.points : 0;
    console.log(
      `User ${userId} selected index ${dto.selectedIndex} for question ${dto.questionId}. Correct index is ${question.correctIndex}. isCorrect=${isCorrect}, mark=${mark}`,
    );

    // Upsert progress (one per user/question)
    const existingProgress = await prisma.userQuizProgress.findFirst({
      where: { userId: userId, questionId: dto.questionId },
    });

    if (existingProgress) {
      console.log(
        `Updating existing progress for user ${userId}, question ${dto.questionId}`,
      );
      await prisma.userQuizProgress.update({
        where: { id: existingProgress.id },
        data: { mark },
      });
    } else {
      console.log(
        `Creating new progress for user ${userId}, question ${dto.questionId}`,
      );
      await prisma.userQuizProgress.create({
        data: { userId, questionId: dto.questionId, mark },
      });
    }
    console.log(
      `User ${userId} answered question ${dto.questionId}: selected ${dto.selectedIndex}, correct ${question.correctIndex}, isCorrect=${isCorrect}, mark=${mark}`,
    );
    return {
      questionId: dto.questionId,
      isCorrect,
      mark,
      correctIndex: question.correctIndex,
    };
  }

  async getUserProgress(
    userId: string,
  ): Promise<
    UserProgressSummaryDto & {
      rank: string;
      nextRank: string;
      pointsToNextRank: number;
    }
  > {
    const progress = await prisma.userQuizProgress.findMany({
      where: { userId },
      include: { question: { include: { quiz: true } } },
    });
    const totalMarks = progress.reduce((sum, p) => sum + p.mark, 0);

    // Calculate Rank Dynamically
    let rank = 'Novice';
    let nextRank = 'Level 1 Engineer';
    let pointsToNextRank = 100 - totalMarks;

    if (totalMarks >= 1000) {
      rank = 'DevSecOps Architect';
      nextRank = 'Max Level';
      pointsToNextRank = 0;
    } else if (totalMarks >= 500) {
      rank = 'Senior CI/CD Engineer';
      nextRank = 'DevSecOps Architect';
      pointsToNextRank = 1000 - totalMarks;
    } else if (totalMarks >= 250) {
      rank = 'Level 2 Engineer';
      nextRank = 'Senior CI/CD Engineer';
      pointsToNextRank = 500 - totalMarks;
    } else if (totalMarks >= 100) {
      rank = 'Level 1 Engineer';
      nextRank = 'Level 2 Engineer';
      pointsToNextRank = 250 - totalMarks;
    } else {
      // Novice
      pointsToNextRank = 100 - totalMarks;
    }

    const byCourse: Record<number, { marks: number; questions: number }> = {};
    const byQuiz: Record<number, { marks: number; questions: number }> = {};
    for (const p of progress) {
      const courseId = p.question.quiz.courseModuleId;
      const quizId = p.question.quizId;
      byCourse[courseId] = byCourse[courseId] || { marks: 0, questions: 0 };
      byCourse[courseId].marks += p.mark;
      byCourse[courseId].questions += 1;
      byQuiz[quizId] = byQuiz[quizId] || { marks: 0, questions: 0 };
      byQuiz[quizId].marks += p.mark;
      byQuiz[quizId].questions += 1;
    }
    console.log(
      `User ${userId} progress summary: totalQuestions=${progress.length}, totalMarks=${totalMarks}, rank=${rank}`,
    );
    return {
      userId,
      totalQuestions: progress.length,
      totalMarks,
      rank,
      nextRank,
      pointsToNextRank: Math.max(0, pointsToNextRank),
      byCourse: Object.entries(byCourse).map(([courseModuleId, v]) => ({
        courseModuleId: +courseModuleId,
        ...v,
      })),
      byQuiz: Object.entries(byQuiz).map(([quizId, v]) => ({
        quizId: +quizId,
        ...v,
      })),
      questions: progress.map((p) => ({
        questionId: p.questionId,
        quizId: p.question.quizId,
        mark: p.mark,
        isCorrect: p.mark > 0,
        correctIndex: p.question.correctIndex,
      })),
    };
  }

  async resetUserProgress(userId: string): Promise<{ success: boolean }> {
    await prisma.userQuizProgress.deleteMany({ where: { userId } });
    return { success: true };
  }
}
