import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  BadRequestException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GithubService } from './github.service';
import {
  AuthorizeGithubDto,
  GithubCallbackDto,
  UpdateRepositoriesDto,
} from './dto';

@Controller('integrations/github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  /**
   * POST /integrations/github/authorize
   * Initiates GitHub OAuth flow
   */
  @Post('authorize')
  async authorize(@Body() dto: AuthorizeGithubDto) {
    const authUrl = this.githubService.generateAuthorizationUrl(
      dto.userId,
      dto.redirectUri,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub authorization URL generated',
      data: {
        authorizationUrl: authUrl,
      },
    };
  }

  /**
   * GET /integrations/github/callback
   * GitHub redirects here after user authorizes
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      // Decode state to get userId and redirectUri
      const decodedState = JSON.parse(
        Buffer.from(state, 'base64').toString('utf8'),
      );
      const { userId, redirectUri } = decodedState;

      // Exchange code for access token
      const accessToken = await this.githubService.exchangeCodeForToken(code);

      // Fetch user's organizations
      const organizations =
        await this.githubService.fetchUserOrganizations(accessToken);

      // Store connection and organizations
      await this.githubService.storeConnection(
        userId,
        accessToken,
        organizations,
      );

      // Redirect to frontend with success
      if (redirectUri) {
        return res.redirect(
          `${redirectUri}?status=success&organizations=${organizations.length}`,
        );
      }

      return res.json({
        statusCode: HttpStatus.OK,
        message: 'GitHub connected successfully',
        data: {
          organizations: organizations.map((org) => ({
            id: org.id,
            name: org.login,
          })),
        },
      });
    } catch (error) {
      // Redirect to frontend with error
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
   * PUT /integrations/github/repositories
   * Update allowed repository list for an organization
   */
  @Put('repositories')
  async updateRepositories(@Body() dto: UpdateRepositoriesDto) {
    const orgAccess = await this.githubService.updateRepositoryPermissions(
      dto.userId,
      dto.organizationId,
      dto.repositories,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Repository permissions updated successfully',
      data: {
        organizationId: orgAccess.organizationId,
        organizationName: orgAccess.organizationName,
        repositoryCount: dto.repositories.length,
      },
    };
  }

  /**
   * GET /integrations/github/connections
   * Get user's GitHub connections and organizations
   */
  @Get('connections')
  async getConnections(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    const connection = await this.githubService.getUserConnections(userId);

    if (!connection) {
      return {
        statusCode: HttpStatus.OK,
        message: 'No GitHub connection found',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'GitHub connection retrieved',
      data: {
        provider: connection.provider,
        status: connection.status,
        connectedAt: connection.createdAt,
        organizations: connection.organizationAccess.map((org) => ({
          id: org.organizationId,
          name: org.organizationName,
          repositoryCount: Array.isArray(org.repositoryPermissions)
            ? org.repositoryPermissions.length
            : 0,
          lastSynced: org.lastSyncedAt,
        })),
      },
    };
  }

  /**
   * GET /integrations/github/organizations/:orgName/repositories
   * Fetch all repositories for an organization (for frontend to display)
   */
  @Get('organizations/:orgName/repositories')
  async getOrganizationRepositories(
    @Query('userId') userId: string,
    @Query('orgName') orgName: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    // Get access token
    const accessToken = await this.githubService.getAccessToken(userId);

    // Fetch repositories
    const repositories = await this.githubService.fetchOrganizationRepositories(
      accessToken,
      orgName,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Repositories fetched successfully',
      data: {
        organizationName: orgName,
        repositories: repositories.map((repo) => ({
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
        })),
      },
    };
  }
}
