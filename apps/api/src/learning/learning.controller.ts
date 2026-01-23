import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LearningService } from './learning.service';
import type { SubmitAnswerDto } from './dto/check-answers.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('learning')
export class LearningController {
  constructor(private readonly service: LearningService) {}

  // 1. Get modules with quizzes (no questions)
  @UseGuards(JwtAuthGuard)
  @Get('modules')
  async getModulesWithQuizzes() {
    return this.service.getModulesWithQuizzes();
  }

  // 2. Get quiz with questions+answers
  @UseGuards(JwtAuthGuard)
  @Get('quiz/:quizId')
  async getQuiz(@Param('quizId') quizId: string) {
    return this.service.getQuiz(Number(quizId));
  }

  // 3. Update user progress (submit answer for a question)
  @UseGuards(JwtAuthGuard)
  @Post('progress')
  async updateUserProgress(@Req() req, @Body() dto: SubmitAnswerDto) {
    const userId = req.user.id;
    return this.service.updateUserProgress(userId, dto);
  }

  // 4. Get user progress summary
  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async getUserProgress(@Req() req) {
    const userId = req.user.id;
    return this.service.getUserProgress(userId);
  }

  // 5. Re-attempt (reset all progress for user)
  @UseGuards(JwtAuthGuard)
  @Delete('progress')
  async resetUserProgress(@Req() req) {
    const userId = req.user.id;
    return this.service.resetUserProgress(userId);
  }
}
