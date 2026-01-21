import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  aud: string; // Audience (should be "authenticated")
  role: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

export interface UpdateProfileDto {
  fullName?: string;
  bio?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create user from JWT payload
   */
  async getUserFromPayload(payload: JwtPayload) {
    const userId = payload.sub;

    // Extract fullName from user_metadata if available (Supabase custom claims)
    const fullName = (payload as any).user_metadata?.full_name || null;

    // Sync user with database
    const user = await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        email: payload.email,
        updated_at: new Date(),
      },
      create: {
        id: userId,
        email: payload.email,
        fullName: fullName,
      },
    });

    return user;
  }

  /**
   * Extract user info from JWT payload
   */
  extractUserInfo(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    console.log('[AuthService] Fetching profile for user:', userId);

    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        bio: true,
        avatar: true,
        created_at: true,
      },
    });

    if (!profile) {
      console.error('[AuthService] User not found:', userId);
      throw new Error(`User not found: ${userId}`);
    }

    console.log('[AuthService] ✓ Profile fetched:', profile.id);
    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        bio: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}
