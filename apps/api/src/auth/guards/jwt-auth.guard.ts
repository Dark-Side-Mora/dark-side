import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // console.log('[JwtAuthGuard] Checking authorization...');

    const user = (request as any).user;

    if (!user) {
      console.error('[JwtAuthGuard] ✗ No user found in request');
      throw new UnauthorizedException('Missing or invalid token');
    }

    // console.log('[JwtAuthGuard] ✓ Authorization passed for user:', user.id);
    return true;
  }
}
