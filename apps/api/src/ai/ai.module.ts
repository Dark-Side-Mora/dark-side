import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiSecurityService } from './gemini/gemini-security.service';

@Module({
  imports: [ConfigModule],
  providers: [GeminiSecurityService],
  exports: [GeminiSecurityService],
})
export class AIModule {}
