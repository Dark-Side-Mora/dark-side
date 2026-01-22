import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  BadRequestException,
  HttpStatus,
  Res,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Response } from 'express';
import { GithubAppService } from './github-app.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('integrations/github-app')
export class GithubAppController {
  constructor(private readonly githubAppService: GithubAppService) {}

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
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      const result = await this.githubAppService.handleInstallationCallback(
        code,
        state,
      );

      // Redirect to frontend with success
      if (result.redirectUri) {
        return res.redirect(
          `${result.redirectUri}?status=success&installations=${result.installations.length}`,
        );
      }

      return res.json({
        statusCode: HttpStatus.OK,
        message: 'GitHub App installed successfully',
        data: {
          installations: result.installations.length,
        },
      });
    } catch (error) {
      if (state) {
        try {
          const decodedState = JSON.parse(
            Buffer.from(state, 'base64').toString('utf8'),
          );
          if (decodedState.redirectUri) {
            return res.redirect(
              `${decodedState.redirectUri}?status=error&message=${error.message}`,
            );
          }
        } catch {}
      }

      throw error;
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
   * POST /integrations/github-app/installations/:installationId/sync
   * Sync installation repositories from GitHub
   */
  // @UseGuards(JwtAuthGuard)
  // @Post('installations/:installationId/sync')
  // async syncInstallation(@Param('installationId') installationId: string) {
  //   if (!installationId) {
  //     throw new BadRequestException('installationId is required');
  //   }

  //   const result =
  //     await this.githubAppService.syncInstallationRepositories(installationId);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Installation synced successfully',
  //     data: result,
  //   };
  // }

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
    // TODO: Verify webhook signature

    await this.githubAppService.handleWebhookEvent(event, payload);

    return {
      statusCode: HttpStatus.OK,
      message: 'Webhook processed',
    };
  }
}
