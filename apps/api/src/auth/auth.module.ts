import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtMiddleware } from './jwt.middleware';
import { PrismaService } from '../prisma/prisma.service';

console.log('[AuthModule] Loading...');

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    console.log('[AuthModule] Registering JWT middleware');
    consumer.apply(JwtMiddleware).forRoutes('*');
  }

  constructor() {
    console.log('[AuthModule] ✓ Initialized successfully');
  }
}
