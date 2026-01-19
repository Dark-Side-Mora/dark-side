import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoadQuizzesQuery,
  QuizDto,
  LoadQuizzesResponseDto,
  QuestionDto,
} from './dto/load-quizzes.dto';
import {
  CheckAnswersDto,
  AnswerCheckResult,
  CheckAnswersResponseDto,
} from './dto/check-answers.dto';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load all available quizzes with optional filtering
   * If userId provided, includes user's progress
   */
  async loadQuizzes(query: LoadQuizzesQuery): Promise<LoadQuizzesResponseDto> {
    try {
      // Build filter based on query params
      const where: any = {};
      if (query.category) where.category = query.category;
      if (query.difficulty) where.difficulty = query.difficulty;
      if (query.type) where.type = query.type;

      // Fetch quizzes with their questions
      const quizzes = await this.prisma.quiz.findMany({
        where,
        include: {
          questions: {
            select: {
              id: true,
              order: true,
              title: true,
              description: true,
              type: true,
              vulnerableCode: true,
              codeLanguage: true,
              choices: true,
              hint: true,
              // Don't send explanation here - only after submission
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const result: LoadQuizzesResponseDto = {
        quizzes: quizzes.map((quiz) => this.mapQuizToDto(quiz)),
      };

      // If userId provided, fetch user's progress
      if (query.userId) {
        const progressRecords = await this.prisma.userQuizProgress.findMany({
          where: { userId: query.userId },
          select: {
            quizId: true,
            status: true,
            progress: true,
            marks: true,
            totalMarks: true,
            currentQuestion: true,
            attemptCount: true,
            completedAt: true,
          },
        });

        const progressMap: { [quizId: string]: any } = {};
        progressRecords.forEach((record) => {
          progressMap[record.quizId] = {
            quizId: record.quizId,
            status: record.status,
            progress: record.progress,
            marks: record.marks,
            totalMarks: record.totalMarks,
            currentQuestion: record.currentQuestion,
            attemptCount: record.attemptCount,
            completedAt: record.completedAt?.toISOString(),
          };
        });

        result.progress = progressMap;
      }

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to load quizzes: ' + error.message);
    }
  }

  /**
   * Get a single quiz by ID for taking the quiz
   */
  async getQuizForTaking(quizId: string, userId: string) {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            select: {
              id: true,
              order: true,
              title: true,
              description: true,
              type: true,
              vulnerableCode: true,
              codeLanguage: true,
              choices: true,
              hint: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Create or update user progress
      const progress = (await this.prisma.userQuizProgress.upsert({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
        update: {
          status: 'in-progress',
          startedAt: new Date(), // Update start time if resuming
        },
        create: {
          userId,
          quizId,
          status: 'in-progress',
          progress: 0,
          marks: 0,
          totalMarks: quiz.totalQuestions * 10, // Assuming 10 points per question
          attemptCount: 1,
          startedAt: new Date(),
        },
      })) as any;

      return {
        quiz: this.mapQuizToDto(quiz),
        progress: {
          currentQuestion: progress.currentQuestion || 1,
          attemptCount: progress.attemptCount,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check user's answers and calculate marks
   */
  async checkAnswers(
    userId: string,
    quizId: string,
    checkAnswersDto: CheckAnswersDto,
  ): Promise<CheckAnswersResponseDto> {
    try {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Get user progress
      const userProgress = await this.prisma.userQuizProgress.findUnique({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
      });

      if (!userProgress) {
        throw new BadRequestException('User has not started this quiz');
      }

      const results: AnswerCheckResult[] = [];
      let totalMarksEarned = 0;
      const totalPossibleMarks = quiz.questions.reduce(
        (sum, q) => sum + (q.answers[0]?.points || 10),
        0,
      );

      // Process each answer
      for (const submittedAnswer of checkAnswersDto.answers) {
        const question = quiz.questions.find(
          (q) => q.id === submittedAnswer.questionId,
        );
        if (!question) continue;

        const correctAnswer = question.answers[0];
        const isCorrect = this.evaluateAnswer(
          question,
          submittedAnswer,
          correctAnswer,
        );
        const pointsEarned = isCorrect ? correctAnswer?.points || 10 : 0;
        totalMarksEarned += pointsEarned;

        // Save user answer
        await this.prisma.userQuizAnswer.upsert({
          where: {
            progressId_questionId: {
              progressId: userProgress.id,
              questionId: question.id,
            },
          },
          update: {
            submittedCode: submittedAnswer.submittedCode,
            submittedChoice: submittedAnswer.submittedChoice,
            submittedText: submittedAnswer.submittedText,
            isCorrect,
            pointsEarned,
          },
          create: {
            progressId: userProgress.id,
            questionId: question.id,
            submittedCode: submittedAnswer.submittedCode,
            submittedChoice: submittedAnswer.submittedChoice,
            submittedText: submittedAnswer.submittedText,
            isCorrect,
            pointsEarned,
          },
        });

        results.push({
          questionId: question.id,
          isCorrect,
          pointsEarned,
          explanation: question.explanation,
        });
      }

      // Update user progress
      const percentage = Math.round(
        (totalMarksEarned / totalPossibleMarks) * 100,
      );
      await this.prisma.userQuizProgress.update({
        where: { id: userProgress.id },
        data: {
          status: 'completed',
          marks: totalMarksEarned,
          totalMarks: totalPossibleMarks,
          progress: percentage,
          completedAt: new Date(),
        },
      });

      return {
        quizId,
        results,
        totalMarks: totalMarksEarned,
        totalPossibleMarks,
        percentage,
        status: 'completed',
        message: `Quiz completed! You scored ${totalMarksEarned}/${totalPossibleMarks} (${percentage}%)`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset quiz progress to allow user to reattempt
   */
  async reattemptQuiz(userId: string, quizId: string) {
    try {
      const progress = await this.prisma.userQuizProgress.findUnique({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
      });

      if (!progress) {
        throw new NotFoundException('User progress not found for this quiz');
      }

      // Delete all previous answers
      await this.prisma.userQuizAnswer.deleteMany({
        where: { progressId: progress.id },
      });

      // Reset progress
      const updated = await this.prisma.userQuizProgress.update({
        where: { id: progress.id },
        data: {
          status: 'in-progress',
          marks: 0,
          progress: 0,
          currentQuestion: null,
          attemptCount: progress.attemptCount + 1,
          completedAt: null,
          startedAt: new Date(),
        },
      });

      return {
        message: 'Quiz reset successfully. You can now reattempt.',
        attemptCount: updated.attemptCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Evaluate if the submitted answer is correct
   */
  private evaluateAnswer(
    question: any,
    submittedAnswer: any,
    correctAnswer: any,
  ): boolean {
    if (question.type === 'workflow-fix') {
      // For workflow-fix, do basic comparison (could use code diff tools for more accuracy)
      return (
        this.normalizeCode(submittedAnswer.submittedCode) ===
        this.normalizeCode(correctAnswer.correctCode)
      );
    } else if (question.type === 'multiple-choice') {
      return submittedAnswer.submittedChoice === correctAnswer.correctChoice;
    } else if (question.type === 'short-answer') {
      // For short-answer, check if submitted answer is in acceptable answers
      const normalizedSubmitted =
        submittedAnswer.submittedText?.toLowerCase().trim() || '';
      return correctAnswer.acceptableAnswers.some(
        (answer: string) => answer.toLowerCase().trim() === normalizedSubmitted,
      );
    }
    return false;
  }

  /**
   * Normalize code for comparison (remove extra whitespace)
   */
  private normalizeCode(code: string): string {
    return code?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
  }

  /**
   * Map Quiz DB model to DTO
   */
  private mapQuizToDto(quiz: any): QuizDto {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      type: quiz.type,
      totalQuestions: quiz.totalQuestions,
      estimatedTime: quiz.estimatedTime,
      tags: quiz.tags || [],
      questions: quiz.questions.map((q: any) => ({
        id: q.id,
        order: q.order,
        title: q.title,
        description: q.description,
        type: q.type,
        vulnerableCode: q.vulnerableCode,
        codeLanguage: q.codeLanguage,
        choices: q.choices,
        hint: q.hint,
      })),
    };
  }
}
