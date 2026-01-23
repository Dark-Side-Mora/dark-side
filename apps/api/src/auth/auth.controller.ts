import {
  Controller,
  Get,
  Post,
  Patch,
  Request,
  UseGuards,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { UpdateProfileDto } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('test')
  testRoute() {
    return {
      message: 'Auth endpoints are working',
      endpoints: [
        'GET /auth/test - This endpoint (no auth required)',
        'GET /auth/protected - Test protected endpoint (requires Bearer token)',
        'GET /auth/profile - Get user profile (requires Bearer token)',
        'POST /auth/sync-profile - Sync profile data (requires Bearer token)',
        'PATCH /auth/profile - Update user profile (requires Bearer token)',
      ],
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    try {
      console.log('[AuthController] GET /profile - user:', req.user?.id);
      const profile = await this.authService.getProfile(req.user.id);
      console.log('[AuthController] ✓ Profile returned');
      return profile;
    } catch (error) {
      console.error('[AuthController] Error fetching profile:', error.message);
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync-profile')
  async syncProfile(@Request() req, @Body() data: UpdateProfileDto) {
    try {
      console.log(
        '[AuthController] POST /sync-profile - user:',
        req.user?.id,
        'data:',
        data,
      );
      const updated = await this.authService.updateProfile(req.user.id, data);
      console.log('[AuthController] ✓ Profile synced');
      return updated;
    } catch (error) {
      console.error('[AuthController] Error syncing profile:', error.message);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() data: UpdateProfileDto) {
    try {
      console.log('[AuthController] PATCH /profile - user:', req.user?.id);
      const updated = await this.authService.updateProfile(req.user.id, data);
      console.log('[AuthController] ✓ Profile updated');
      return updated;
    } catch (error) {
      console.error('[AuthController] Error updating profile:', error.message);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  protectedRoute(@Request() req) {
    return {
      message: 'This is a protected route',
      user: req.user,
    };
  }
}
