import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { LearningService } from './learning.service';
import {
  LoadQuizzesQuery,
  type LoadQuizzesResponseDto,
} from './dto/load-quizzes.dto';
import type {
  CheckAnswersDto,
  CheckAnswersResponseDto,
} from './dto/check-answers.dto';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  /**
   * GET /learning/quizzes
   * Load all available quizzes with optional filtering
   *
   * Query Parameters:
   * - category: Filter by category (security, best-practices, etc.)
   * - difficulty: Filter by difficulty (beginner, intermediate, advanced)
   * - type: Filter by type (workflow-fix, multiple-choice, etc.)
   * - userId: (Optional) To include user's progress on each quiz
   *
   * @example
   * GET /learning/quizzes?userId=user123&difficulty=beginner
   */
  @Get('quizzes')
  async loadQuizzes(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: LoadQuizzesResponseDto;
  }> {
    try {
      const query: LoadQuizzesQuery = {
        category,
        difficulty,
        type,
        userId,
      };

      const data = await this.learningService.loadQuizzes(query);

      return {
        statusCode: HttpStatus.OK,
        message: `Loaded ${data.quizzes.length} quizzes`,
        data,
      };
    } catch (error) {
      throw new BadRequestException('Failed to load quizzes: ' + error.message);
    }
  }

  /**
   * POST /learning/quizzes/:quizId/start
   * Initialize/start a quiz for a user
   *
   * @param quizId - The quiz ID to start
   * @param userId - User ID (required in query)
   *
   * @example
   * POST /learning/quizzes/quiz123/start?userId=user123
   */
  @Post('quizzes/:quizId/start')
  async startQuiz(
    @Param('quizId') quizId: string,
    @Query('userId') userId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const data = await this.learningService.getQuizForTaking(quizId, userId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Quiz started successfully',
        data,
      };
    } catch (error) {
      throw new BadRequestException('Failed to start quiz: ' + error.message);
    }
  }

  /**
   * POST /learning/quizzes/:quizId/check-answers
   * Check user's answers and return scoring
   *
   * @param quizId - The quiz ID being submitted
   * @param userId - User ID (required in query)
   * @param checkAnswersDto - Array of answers with questionId and user's response
   *
   * @example
   * POST /learning/quizzes/quiz123/check-answers?userId=user123
   * Body:
   * {
   *   "answers": [
   *     {
   *       "questionId": "q1",
   *       "submittedCode": "# fixed workflow code"
   *     },
   *     {
   *       "questionId": "q2",
   *       "submittedChoice": 1
   *     }
   *   ]
   * }
   */
  @Post('quizzes/:quizId/check-answers')
  async checkAnswers(
    @Param('quizId') quizId: string,
    @Query('userId') userId: string,
    @Body() checkAnswersDto: CheckAnswersDto,
  ): Promise<{
    statusCode: number;
    message: string;
    data: CheckAnswersResponseDto;
  }> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      if (!checkAnswersDto.answers || checkAnswersDto.answers.length === 0) {
        throw new BadRequestException('At least one answer must be submitted');
      }

      const data = await this.learningService.checkAnswers(
        userId,
        quizId,
        checkAnswersDto,
      );

      return {
        statusCode: HttpStatus.OK,
        message: data.message,
        data,
      };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Failed to check answers: ' + error.message);
    }
  }

  /**
   * POST /learning/quizzes/:quizId/reattempt
   * Reset quiz progress to allow reattempting
   *
   * @param quizId - The quiz ID to reattempt
   * @param userId - User ID (required in query)
   */
  @Post('quizzes/:quizId/reattempt')
  async reattemptQuiz(
    @Param('quizId') quizId: string,
    @Query('userId') userId: string,
  ): Promise<{
    statusCode: number;
    message: string;
    data: any;
  }> {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      const data = await this.learningService.reattemptQuiz(userId, quizId);

      return {
        statusCode: HttpStatus.OK,
        message: data.message,
        data,
      };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Failed to reattempt quiz: ' + error.message);
    }
  }

  /**
   * GET /learning/health
   * Health check endpoint for learning service
   */
  @Get('health')
  healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Learning service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
