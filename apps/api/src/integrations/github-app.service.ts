import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface GitHubAppInstallation {
  id: number;
  account: {
    id: number;
    login: string;
    type: string;
  };
  repository_selection: string;
  permissions: Record<string, string>;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
}

@Injectable()
export class GithubAppService {
  private readonly GITHUB_APP_ID: string;
  private readonly GITHUB_APP_PRIVATE_KEY: string;
  private readonly GITHUB_APP_CLIENT_ID: string;
  private readonly GITHUB_APP_CLIENT_SECRET: string;
  private readonly ENCRYPTION_KEY: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.GITHUB_APP_ID = this.configService.get<string>('GITHUB_APP_ID') || '';
    this.GITHUB_APP_PRIVATE_KEY =
      this.configService.get<string>('GITHUB_APP_PRIVATE_KEY') || '';
    this.GITHUB_APP_CLIENT_ID =
      this.configService.get<string>('GITHUB_APP_CLIENT_ID') || '';
    this.GITHUB_APP_CLIENT_SECRET =
      this.configService.get<string>('GITHUB_APP_CLIENT_SECRET') || '';
    this.ENCRYPTION_KEY =
      this.configService.get<string>('ENCRYPTION_KEY') || '';

    if (!this.GITHUB_APP_ID || !this.GITHUB_APP_PRIVATE_KEY) {
      console.warn('GitHub App credentials not configured');
    }
  }

  /**
   * Generate GitHub App OAuth authorization URL (to get user token and fetch installations)
   */
  generateAuthorizationUrl(userId: string, redirectUri?: string): string {
    const state = Buffer.from(JSON.stringify({ userId, redirectUri })).toString(
      'base64',
    );

    const params = new URLSearchParams({
      client_id: this.GITHUB_APP_CLIENT_ID,
      redirect_uri:
        this.configService.get<string>('GITHUB_APP_CALLBACK_URL') || '',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Generate GitHub App installation URL (direct install, but won't fetch installations without OAuth)
   */
  generateInstallationUrl(userId: string, redirectUri?: string): string {
    const state = Buffer.from(JSON.stringify({ userId, redirectUri })).toString(
      'base64',
    );

    const params = new URLSearchParams({
      state,
    });

    return `https://github.com/apps/${this.configService.get<string>('GITHUB_APP_NAME')}/installations/new?${params.toString()}`;
  }

  /**
   * Handle installation callback - exchange code for access token
   */
  async handleInstallationCallback(code: string, state: string) {
    const { userId, redirectUri } = JSON.parse(
      Buffer.from(state, 'base64').toString('utf8'),
    );

    // Exchange code for user access token
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.GITHUB_APP_CLIENT_ID,
          client_secret: this.GITHUB_APP_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      ),
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user's installations
    const installations = await this.fetchUserInstallations(accessToken);

    // Store installations in database
    for (const installation of installations) {
      await this.storeInstallation(userId, installation, accessToken);
    }

    return { userId, redirectUri, installations };
  }

  /**
   * Fetch user's GitHub App installations
   */
  async fetchUserInstallations(
    accessToken: string,
  ): Promise<GitHubAppInstallation[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.github.com/user/installations', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );

      return response.data.installations || [];
    } catch (error) {
      console.error(
        'Failed to fetch installations:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch installations');
    }
  }

  /**
   * Get installation access token for API calls
   */
  async getInstallationAccessToken(installationId: string): Promise<string> {
    try {
      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.GITHUB_APP_ID,
          privateKey: this.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
          installationId: parseInt(installationId),
        },
      });

      const { data } = await octokit.request(
        'POST /app/installations/{installation_id}/access_tokens',
        {
          installation_id: parseInt(installationId),
        },
      );

      return data.token;
    } catch (error) {
      console.error('Failed to get installation token:', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with GitHub App',
      );
    }
  }

  /**
   * Fetch repositories for an installation
   */
  async fetchInstallationRepositories(
    installationId: string,
  ): Promise<GitHubRepository[]> {
    try {
      const accessToken = await this.getInstallationAccessToken(installationId);
      const octokit = new Octokit({
        auth: accessToken,
      });
      const { data } = await octokit.request('GET /installation/repositories', {
        per_page: 100,
      });

      return data.repositories;
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      throw new InternalServerErrorException('Failed to fetch repositories');
    }
  }

  /**
   * Store installation in database
   */
  async storeInstallation(
    userId: string,
    installation: GitHubAppInstallation,
    userAccessToken: string,
  ) {
    const encryptedToken = this.encryptToken(userAccessToken);

    // Create or update connection
    const connection = await this.prisma.integrationConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'github-app',
        },
      },
      update: {
        accessToken: encryptedToken,
        status: 'active',
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'github-app',
        accessToken: encryptedToken,
        status: 'active',
      },
    });

    // Store installation
    const installationRecord = await this.prisma.gitHubInstallation.upsert({
      where: {
        installationId: installation.id.toString(),
      },
      update: {
        userId,
        connectionId: connection.id,
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.account.type,
        permissions: installation.permissions,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? 'suspended' : 'active',
        updatedAt: new Date(),
      },
      create: {
        userId,
        connectionId: connection.id,
        installationId: installation.id.toString(),
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.account.type,
        permissions: installation.permissions,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? 'suspended' : 'active',
      },
    });

    // Fetch and store repositories
    const repositories = await this.fetchInstallationRepositories(
      installation.id.toString(),
    );

    for (const repo of repositories) {
      await this.prisma.gitHubRepository.upsert({
        where: {
          installationId_repositoryId: {
            installationId: installationRecord.id,
            repositoryId: repo.id.toString(),
          },
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          updatedAt: new Date(),
        },
        create: {
          installationId: installationRecord.id,
          repositoryId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
        },
      });
    }

    return installationRecord;
  }

  /**
   * Get user's installations with repositories
   */
  async getUserInstallations(userId: string) {
    const installations = await this.prisma.gitHubInstallation.findMany({
      where: { userId },
      include: {
        repositories: true,
      },
      orderBy: {
        installedAt: 'desc',
      },
    });

    return installations;
  }

  /**
   * Sync installation repositories (refresh from GitHub)
   */
  async syncInstallationRepositories(installationId: string) {
    const installation = await this.prisma.gitHubInstallation.findUnique({
      where: { id: installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    const repositories = await this.fetchInstallationRepositories(
      installation.installationId,
    );

    // Delete removed repositories
    await this.prisma.gitHubRepository.deleteMany({
      where: {
        installationId,
        repositoryId: {
          notIn: repositories.map((r) => r.id.toString()),
        },
      },
    });

    // Upsert current repositories
    for (const repo of repositories) {
      await this.prisma.gitHubRepository.upsert({
        where: {
          installationId_repositoryId: {
            installationId,
            repositoryId: repo.id.toString(),
          },
        },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          updatedAt: new Date(),
        },
        create: {
          installationId,
          repositoryId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
        },
      });
    }

    return { synced: repositories.length };
  }

  /**
   * Handle installation webhook events
   */
  async handleWebhookEvent(event: string, payload: any) {
    switch (event) {
      case 'installation':
        return this.handleInstallationEvent(payload);
      case 'installation_repositories':
        return this.handleInstallationRepositoriesEvent(payload);
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handleInstallationEvent(payload: any) {
    const { action, installation, sender } = payload;

    if (action === 'deleted') {
      // Remove installation
      await this.prisma.gitHubInstallation.updateMany({
        where: { installationId: installation.id.toString() },
        data: { status: 'removed' },
      });
    }

    return { processed: true };
  }

  private async handleInstallationRepositoriesEvent(payload: any) {
    const { action, installation, repositories_added, repositories_removed } =
      payload;

    const installationRecord = await this.prisma.gitHubInstallation.findUnique({
      where: { installationId: installation.id.toString() },
    });

    if (!installationRecord) {
      console.warn(`Installation ${installation.id} not found in database`);
      return { processed: false };
    }

    if (action === 'added' && repositories_added) {
      // Add new repositories
      for (const repo of repositories_added) {
        await this.prisma.gitHubRepository.create({
          data: {
            installationId: installationRecord.id,
            repositoryId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
          },
        });
      }
    }

    if (action === 'removed' && repositories_removed) {
      // Remove repositories
      for (const repo of repositories_removed) {
        await this.prisma.gitHubRepository.deleteMany({
          where: {
            installationId: installationRecord.id,
            repositoryId: repo.id.toString(),
          },
        });
      }
    }

    return { processed: true };
  }

  /**
   * Encrypt token
   */
  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv,
    );

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt token
   */
  private decryptToken(encryptedToken: string): string {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv,
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get installation token for a specific repository
   * This is used by pipeline services to authenticate API calls
   */
  async getInstallationTokenForRepo(
    userId: string,
    repoFullName: string,
  ): Promise<{ token: string; installationId: string }> {
    // Find the installation that has access to this repository
    const installation = await this.prisma.gitHubInstallation.findFirst({
      where: {
        userId,
        status: 'active',
        repositories: {
          some: {
            fullName: repoFullName,
          },
        },
      },
    });

    if (!installation) {
      throw new BadRequestException(
        `No active GitHub App installation found for repository ${repoFullName}`,
      );
    }

    // Get installation access token
    const token = await this.getInstallationAccessToken(
      installation.installationId,
    );

    return {
      token,
      installationId: installation.installationId,
    };
  }
}
