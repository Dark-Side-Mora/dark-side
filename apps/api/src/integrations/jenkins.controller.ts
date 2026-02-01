import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JenkinsService } from './jenkins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrations/jenkins')
export class JenkinsController {
  constructor(private readonly jenkinsService: JenkinsService) {}

  @Post('push')
  async handlePush(
    @Body() payload: any,
    @Headers('x-ci-insight-token') token: string,
  ) {
    if (!token) {
      throw new UnauthorizedException('Missing x-ci-insight-token header');
    }

    return this.jenkinsService.processPushData(payload, token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('setup')
  async getSetup(@Req() req) {
    return this.jenkinsService.getOrCreateSetupToken(req.user.id);
  }
}
