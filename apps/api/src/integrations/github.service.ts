import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GithubOrganization {
  id: number;
  login: string;
  description?: string;
}

interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
}

@Injectable()
export class GithubService {
  private readonly GITHUB_CLIENT_ID: string;
  private readonly GITHUB_CLIENT_SECRET: string;
  private readonly ENCRYPTION_KEY: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.GITHUB_CLIENT_ID =
      this.configService.get<string>('GITHUB_CLIENT_ID') || '';
    this.GITHUB_CLIENT_SECRET =
      this.configService.get<string>('GITHUB_CLIENT_SECRET') || '';
    this.ENCRYPTION_KEY =
      this.configService.get<string>('ENCRYPTION_KEY') || '';

    if (!this.GITHUB_CLIENT_ID || !this.GITHUB_CLIENT_SECRET) {
      console.warn('GitHub OAuth credentials not configured');
    }
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  generateAuthorizationUrl(userId: string, redirectUri?: string): string {
    const state = Buffer.from(JSON.stringify({ userId, redirectUri })).toString(
      'base64',
    );

    const params = new URLSearchParams({
      client_id: this.GITHUB_CLIENT_ID,
      redirect_uri: this.configService.get<string>('GITHUB_CALLBACK_URL') || '',
      scope: 'read:org,repo', // Permissions needed
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GithubTokenResponse>(
          'https://github.com/login/oauth/access_token',
          {
            client_id: this.GITHUB_CLIENT_ID,
            client_secret: this.GITHUB_CLIENT_SECRET,
            code,
          },
          {
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data.access_token;
    } catch (error) {
      throw new BadRequestException('Failed to exchange code for token');
    }
  }

  /**
   * Fetch user's GitHub organizations
   */
  async fetchUserOrganizations(
    accessToken: string,
  ): Promise<GithubOrganization[]> {
    try {
      // Fetch user info first
      const userResponse = await firstValueFrom(
        this.httpService.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );

      const user = userResponse.data;

      // Fetch organizations
      const orgsResponse = await firstValueFrom(
        this.httpService.get<GithubOrganization[]>(
          'https://api.github.com/user/orgs',
          {
            headers: {
              Authorization: `token ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        ),
      );

      // Add user's personal account as the first "organization"
      const personalAccount = {
        id: user.id,
        login: user.login,
        description: 'Personal repositories',
      };

      return [personalAccount, ...orgsResponse.data];
    } catch (error) {
      console.error(
        'Failed to fetch organizations:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch organizations');
    }
  }

  /**
   * Fetch repositories for a specific organization or user
   */
  async fetchOrganizationRepositories(
    accessToken: string,
    orgName: string,
  ): Promise<GithubRepository[]> {
    try {
      // First, check if this is the user's personal account
      const userResponse = await firstValueFrom(
        this.httpService.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );

      const isPersonalAccount = userResponse.data.login === orgName;
      const endpoint = isPersonalAccount
        ? 'https://api.github.com/user/repos'
        : `https://api.github.com/orgs/${orgName}/repos`;

      const response = await firstValueFrom(
        this.httpService.get<GithubRepository[]>(endpoint, {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
          params: {
            per_page: 100,
            type: isPersonalAccount ? 'owner' : 'all',
            sort: 'updated',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch repositories for ${orgName}:`,
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        `Failed to fetch repositories for org: ${orgName}`,
      );
    }
  }

  /**
   * Store or update integration connection
   */
  async storeConnection(
    userId: string,
    accessToken: string,
    organizations: GithubOrganization[],
  ) {
    const encryptedToken = this.encryptToken(accessToken);

    // Upsert connection
    const connection = await this.prisma.integrationConnection.upsert({
      where: {
        userId_provider_organizationId: {
          userId,
          provider: 'github',
          organizationId: null as any,
        },
      },
      update: {
        accessToken: encryptedToken,
        status: 'active',
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'github',
        organizationId: null as any,
        accessToken: encryptedToken,
        status: 'active',
      },
    });

    // Store organization access with empty repository permissions initially
    for (const org of organizations) {
      await this.prisma.organizationAccess.upsert({
        where: {
          connectionId_organizationId: {
            connectionId: connection.id,
            organizationId: org.id.toString(),
          },
        },
        update: {
          organizationName: org.login,
          lastSyncedAt: new Date(),
        },
        create: {
          connectionId: connection.id,
          organizationId: org.id.toString(),
          organizationName: org.login,
          repositoryPermissions: [],
        },
      });
    }

    return connection;
  }

  /**
   * Update repository permissions for an organization
   */
  async updateRepositoryPermissions(
    userId: string,
    organizationId: string,
    repositories: Array<{ id: string; name: string; fullName: string }>,
  ) {
    // Find the connection
    const connection = await this.prisma.integrationConnection.findUnique({
      where: {
        userId_provider_organizationId: {
          userId,
          provider: 'github',
          organizationId: null as any,
        },
      },
    });

    if (!connection) {
      throw new BadRequestException('GitHub connection not found');
    }

    // Update organization access
    const orgAccess = await this.prisma.organizationAccess.update({
      where: {
        connectionId_organizationId: {
          connectionId: connection.id,
          organizationId,
        },
      },
      data: {
        repositoryPermissions: repositories,
        lastSyncedAt: new Date(),
      },
    });

    return orgAccess;
  }

  /**
   * Get user's GitHub connections with organizations
   */
  async getUserConnections(userId: string) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: {
        userId_provider_organizationId: {
          userId,
          provider: 'github',
          organizationId: null as any,
        },
      },
      include: {
        organizationAccess: true,
      },
    });

    return connection;
  }

  /**
   * Encrypt access token
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
   * Decrypt access token
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
   * Get decrypted access token for a user
   */
  async getAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: {
        userId_provider_organizationId: {
          userId,
          provider: 'github',
          organizationId: null as any,
        },
      },
    });

    if (!connection) {
      throw new BadRequestException('GitHub connection not found');
    }

    return this.decryptToken(connection.accessToken);
  }
}
