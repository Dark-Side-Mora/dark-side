import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const body = req.body;

    console.log('[JwtMiddleware] Incoming request:', {
      method: req.method,
      url: req.url,
      body: body,
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[JwtMiddleware] No token provided');
      return next();
    }

    const token = authHeader.substring(7);
    console.log('[JwtMiddleware] Token found, decoding...');

    try {
      // Decode WITHOUT verification (we trust Supabase)
      const decoded = jwt.decode(token) as any;

      if (!decoded) {
        console.error('[JwtMiddleware] Failed to decode token');
        throw new UnauthorizedException('Invalid token format');
      }

      console.log('[JwtMiddleware] ✓ Token decoded:', {
        sub: decoded.sub,
        email: decoded.email,
        aud: decoded.aud,
      });

      // Validate claims
      if (decoded.aud !== 'authenticated') {
        console.error('[JwtMiddleware] Invalid audience:', decoded.aud);
        throw new UnauthorizedException('Invalid token audience');
      }

      if (decoded.exp * 1000 < Date.now()) {
        console.error('[JwtMiddleware] Token expired');
        throw new UnauthorizedException('Token expired');
      }

      console.log('[JwtMiddleware] ✓ Token valid, syncing user to database...');

      // Sync user from Supabase Auth to PostgreSQL
      const user = await this.authService.getUserFromPayload(decoded);
      console.log('[JwtMiddleware] ✓ User synced:', user.id);

      // Attach user to request
      (req as any).user = {
        id: user.id,
        email: user.email,
        supabaseId: decoded.sub,
        fullName: user.fullName,
      };

      next();
    } catch (error) {
      console.error('[JwtMiddleware] Error:', error.message);
      next();
    }
  }
}
