import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Res,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { GithubAppService } from './github-app.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Controller('integrations/github-app')
export class GithubAppController {
  constructor(
    private readonly githubAppService: GithubAppService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /integrations/github-app/authorize
   * Generate GitHub App OAuth authorization URL
   */
  @UseGuards(JwtAuthGuard)
  @Post('authorize')
  async initiateAuthorization(
    @Req() req,
    @Body() body: { redirectUri?: string },
  ) {
    const { redirectUri } = body;

    const authUrl = this.githubAppService.generateAuthorizationUrl(
      req.user.id,
      redirectUri,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub App authorization URL generated',
      data: {
        authorizationUrl: authUrl,
      },
    };
  }

  /**
   * POST /integrations/github-app/install
   * Generate GitHub App installation URL
   */
  @UseGuards(JwtAuthGuard)
  @Post('install')
  async initiateInstall(@Req() req, @Body() body: { redirectUri?: string }) {
    const { redirectUri } = body;

    const installUrl = this.githubAppService.generateInstallationUrl(
      req.user.id,
      redirectUri,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub App installation URL generated',
      data: {
        installationUrl: installUrl,
      },
    };
  }

  /**
   * GET /integrations/github-app/callback
   * Handle GitHub App installation callback
   * Supports both OAuth flow (code) and direct installation flow (installation_id)
   */
  @Get('callback')
  async callback(
    @Query('code') code?: string,
    @Query('installation_id') installationId?: string,
    @Query('setup_action') setupAction?: string,
    @Query('state') state?: string,
    // @ts-ignore - NestJS decorators handle parameters differently than TypeScript expects
    @Res() res: Response,
  ) {
    // Decode state to get userId and redirectUri
    let decodedState: { userId?: string; redirectUri?: string } = {
      redirectUri: process.env.FRONTEND_URL || 'http://localhost:3001/projects',
    };

    if (state) {
      try {
        decodedState = JSON.parse(
          Buffer.from(state, 'base64').toString('utf8'),
        );
      } catch (e) {
        console.error('[GithubAppController] Failed to decode state:', e);
      }
    }

    const redirectUri =
      decodedState.redirectUri || 'http://localhost:3001/projects';

    try {
      // Handle direct installation flow (installation_id + setup_action)
      if (installationId && setupAction) {
        console.log(
          `[GithubAppController] Direct installation flow: installationId=${installationId}, setupAction=${setupAction}`,
        );

        // Sync the installation immediately
        if (decodedState.userId) {
          await this.githubAppService.syncInstallationById(
            installationId,
            decodedState.userId,
          );
        }

        return res.redirect(
          `${redirectUri}?status=success&sync=true&installation_id=${installationId}`,
        );
      }

      // Handle OAuth flow (code + state)
      if (code && state) {
        console.log('[GithubAppController] OAuth flow: code received');

        const result = await this.githubAppService.handleInstallationCallback(
          code,
          state,
        );

        return res.redirect(
          `${result.redirectUri}?status=success&installations=${result.installations.length}`,
        );
      }

      // Missing required parameters
      console.warn(
        '[GithubAppController] Missing required callback parameters',
      );
      return res.redirect(
        `${redirectUri}?status=error&message=Invalid callback parameters`,
      );
    } catch (error) {
      console.error('[GithubAppController] Callback error:', error);
      return res.redirect(
        `${redirectUri}?status=error&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * GET /integrations/github-app/installations
   * Get user's GitHub App installations
   */
  @UseGuards(JwtAuthGuard)
  @Get('installations')
  async getInstallations(
    @Req() req,
    @Param() params,
    @Query('include_repos') includeRepos: string,
  ) {
    const installations = await this.githubAppService.getUserInstallations(
      req.user.id,
      includeRepos === 'true',
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Installations retrieved successfully',
      data: {
        installations: installations.map((installation) => ({
          id: installation.id,
          installationId: installation.installationId,
          accountLogin: installation.accountLogin,
          accountType: installation.accountType,
          repositorySelection: installation.repositorySelection,
          repositoryCount: installation.repositories.length,
          status: installation.status,
          installedAt: installation.installedAt,
          repositories: installation.repositories.map((repo) => ({
            id: repo.repositoryId,
            name: repo.name,
            fullName: repo.fullName,
            private: repo.private,
          })),
        })),
      },
    };
  }

  /**
   * POST /integrations/github-app/sync
   * Sync all installations from GitHub
   */
  @UseGuards(JwtAuthGuard)
  @Post('sync')
  async syncAllInstallations(@Req() req) {
    try {
      // Re-fetch all installations from GitHub
      await this.githubAppService.getUserInstallations(req.user.id, true);

      return {
        statusCode: HttpStatus.OK,
        message: 'Installations synced successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to sync installations: ${error.message}`,
      );
    }
  }

  /**
   * POST /integrations/github-app/installations/:installationId/sync
   * Sync specific installation repositories from GitHub
   */
  @UseGuards(JwtAuthGuard)
  @Post('installations/:installationId/sync')
  async syncInstallation(
    @Req() req,
    @Param('installationId') installationId: string,
  ) {
    if (!installationId) {
      throw new BadRequestException('installationId is required');
    }

    const result =
      await this.githubAppService.syncInstallationRepositories(installationId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Installation synced successfully',
      data: result,
    };
  }

  /**
   * POST /integrations/github-app/webhook
   * Handle GitHub App webhook events
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    // Verify webhook signature
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    if (secret) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest =
        'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

      if (digest !== signature) {
        console.warn('[GithubAppController] Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    await this.githubAppService.handleWebhookEvent(event, payload);

    return {
      statusCode: HttpStatus.OK,
      message: 'Webhook processed',
    };
  }
}
