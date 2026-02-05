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

  generateInstallationUrl(userId: string, redirectUri?: string): string {
    const state = Buffer.from(JSON.stringify({ userId, redirectUri })).toString(
      'base64',
    );

    const params = new URLSearchParams({
      state,
    });

    return `https://github.com/apps/${this.configService.get<string>('GITHUB_APP_NAME')}/installations/new?${params.toString()}`;
  }

  async handleInstallationCallback(code: string, state: string) {
    const { userId, redirectUri } = JSON.parse(
      Buffer.from(state, 'base64').toString('utf8'),
    );

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
    const installations = await this.fetchUserInstallations(accessToken);

    for (const installation of installations) {
      await this.storeInstallation(userId, installation, accessToken);
    }

    return { userId, redirectUri, installations };
  }

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

      console.log(
        `[GithubAppService] Fetched ${response.data.installations?.length || 0} installations from GitHub`,
      );
      return response.data.installations || [];
    } catch (error) {
      console.error(
        'Failed to fetch installations:',
        error.response?.data || error.message,
      );

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException(
          'GitHub token invalid or expired. Please reconnect your GitHub account.',
        );
      }

      throw new InternalServerErrorException('Failed to fetch installations');
    }
  }

  async getInstallationAccessToken(installationId: string): Promise<string> {
    try {
      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.GITHUB_APP_ID,
          privateKey: this.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

  async storeInstallation(
    userId: string,
    installation: GitHubAppInstallation,
    userAccessToken: string,
  ) {
    const encryptedToken = this.encryptToken(userAccessToken);

    const connection = await this.prisma.integrationConnection.upsert({
      where: {
        userId_provider_organizationId: {
          userId,
          provider: 'github-app',
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
        provider: 'github-app',
        organizationId: null as any,
        accessToken: encryptedToken,
        status: 'active',
      },
    });

    console.log(`[GithubAppService] Connected GitHub App for user ${userId}`);
    // Create or update installation
    console.log(`[GithubAppService] Storing installation ${installation.id}`);

    // Check if we need to fetch repositories from API
    // This happens when repositories aren't included in the installation object (e.g. during sync)
    let reposToStore: GitHubRepository[] = [];

    // Check if installation.repositories exists and is an array (cast to any as it might not be in the type def)
    const installAny = installation as any;
    if (
      installAny.repositories &&
      Array.isArray(installAny.repositories) &&
      installAny.repositories.length > 0
    ) {
      reposToStore = installAny.repositories as GitHubRepository[];
    } else {
      console.log(
        `[GithubAppService] No internal repos found, fetching from API for installation ${installation.id}`,
      );
      try {
        // Using the existing helper method
        const fetchedRepos = await this.fetchInstallationRepositories(
          installation.id.toString(),
        );
        reposToStore = fetchedRepos;
        console.log(
          `[GithubAppService] Fetched ${reposToStore.length} repositories from API`,
        );
      } catch (err) {
        console.error(
          `[GithubAppService] Failed to fetch repos for installation ${installation.id}:`,
          err,
        );
      }
    }

    const installationRecord = await (
      this.prisma.gitHubInstallation as any
    ).upsert({
      where: {
        installationId: installation.id.toString(),
      },
      update: {
        connectionId: connection.id,
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.account.type,
        permissions: installation.permissions as any,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? 'suspended' : 'active',
        updatedAt: new Date(),
      },
      create: {
        connectionId: connection.id,
        installationId: installation.id.toString(),
        accountId: installation.account.id.toString(),
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        targetType: installation.account.type,
        permissions: installation.permissions as any,
        repositorySelection: installation.repository_selection,
        status: installation.suspended_at ? 'suspended' : 'active',
      },
    });

    await (this.prisma as any).gitHubInstallationUser.upsert({
      where: {
        installationId_userId: {
          installationId: installationRecord.id,
          userId,
        },
      },
      update: {},
      create: {
        installationId: installationRecord.id,
        userId,
      },
    });

    const orgName =
      installation.account.type === 'Organization'
        ? installation.account.login
        : `${installation.account.login} (Personal)`;

    let organization = await this.prisma.organization.findFirst({
      where: {
        name: orgName,
        domain: 'github.com',
      },
    });

    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: orgName,
          domain: 'github.com',
          members: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
      });
      console.log(
        `[GithubAppService] Created new shared Organization: ${orgName}`,
      );
    } else {
      // Ensure user is a member of this existing organization
      await (this.prisma as any).organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId,
          },
        },
        update: {}, // Keep existing role
        create: {
          organizationId: organization.id,
          userId,
          role: 'owner', // Default to owner if they are the one connecting
        },
      });
      console.log(
        `[GithubAppService] User is already a member of Organization: ${orgName}`,
      );
    }

    // Create/update projects for each repository
    for (const repo of reposToStore) {
      // Check if project already exists
      let project = await this.prisma.project.findFirst({
        where: {
          organizationId: organization.id,
          repositoryUrl: repo.full_name,
        },
      });

      if (!project) {
        project = await this.prisma.project.create({
          data: {
            organizationId: organization.id,
            userId,
            name: repo.name,
            provider: 'github',
            repositoryUrl: repo.full_name,
          },
        });
      }

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
          projectId: project.id,
          updatedAt: new Date(),
        },
        create: {
          installationId: installationRecord.id,
          repositoryId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          projectId: project.id,
        },
      });
    }

    return installationRecord;
  }

  /**
   * Sync a single installation by ID (used for direct installation callback)
   */
  async syncInstallationById(installationId: string, userId: string) {
    try {
      console.log(
        `[GithubAppService] Syncing installation ${installationId} for user ${userId}`,
      );

      // Get installation access token (for later use)
      const accessToken = await this.getInstallationAccessToken(installationId);

      // Fetch installation details using App Auth (JWT) - Required for this endpoint
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.GITHUB_APP_ID,
          privateKey: this.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
      });

      const { data: installation } = await appOctokit.request(
        'GET /app/installations/{installation_id}',
        {
          installation_id: parseInt(installationId),
        },
      );

      // Create Octokit instance with Installation Token for repository operations
      const octokit = new Octokit({ auth: accessToken });

      // Fetch repositories for this installation
      const { data: reposData } = await octokit.request(
        'GET /installation/repositories',
        {
          per_page: 100,
        },
      );

      // Store the installation (this also creates organization and projects)
      await this.storeInstallation(userId, installation as any, accessToken);

      console.log(
        `[GithubAppService] Successfully synced installation ${installationId} with ${reposData.repositories.length} repositories`,
      );

      const accountName =
        installation.account && 'login' in installation.account
          ? installation.account.login
          : 'Unknown';

      return {
        installationId,
        repositoryCount: reposData.repositories.length,
        accountName,
      };
    } catch (error) {
      console.error(
        `[GithubAppService] Failed to sync installation ${installationId}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to sync installation: ${error.message}`,
      );
    }
  }

  async getUserInstallations(userId: string, includeRepos: boolean = false) {
    // 1. Fetch currently known installations from DB
    const existingInstallations = await (
      this.prisma.gitHubInstallation as any
    ).findMany({
      where: {
        users: { some: { userId } },
      },
    });

    // 2. Robust Polling: Sync all known installations using App Auth (Private Key)
    // This is extremely reliable as it doesn't depend on the user's OAuth token.
    if (existingInstallations.length > 0) {
      console.log(
        `[GithubAppService] Polling ${existingInstallations.length} known installations for user ${userId}`,
      );
      for (const inst of existingInstallations) {
        try {
          await this.syncInstallationRepositories(inst.id);
        } catch (error) {
          console.error(
            `[GithubAppService] Failed to poll installation ${inst.id}:`,
            error.message,
          );
        }
      }
    }

    // 3. Best-Effort Discovery: Attempt to find NEW installations using User OAuth token
    const connection = await (
      this.prisma.integrationConnection as any
    ).findFirst({
      where: {
        userId,
        provider: 'github-app',
        organizationId: null,
      },
    });

    if (
      connection &&
      connection.status === 'active' &&
      connection.accessToken
    ) {
      try {
        const accessToken = this.decryptToken(connection.accessToken);
        console.log(
          `[GithubAppService] Attempting best-effort discovery for user ${userId}`,
        );

        const githubInstallations =
          await this.fetchUserInstallations(accessToken);
        console.log(
          `[GithubAppService] Found ${githubInstallations.length} installations from GitHub`,
        );

        for (const installation of githubInstallations) {
          try {
            await this.storeInstallation(userId, installation, accessToken);
          } catch (error) {
            console.error(
              `[GithubAppService] Best-effort discovery failed for ${installation.id}:`,
              error.message,
            );
          }
        }
      } catch (error) {
        console.warn(
          '[GithubAppService] Global discovery failed (best-effort):',
          error.message,
        );
        // We stay silent here. Polling above already handled the ones we know.
      }
    } else {
      console.log(
        `[GithubAppService] No active connection found for user ${userId}`,
      );
    }

    const installations = await (
      this.prisma.gitHubInstallation as any
    ).findMany({
      where: {
        users: {
          some: { userId },
        },
      },
      include: {
        repositories: true,
      },
      orderBy: {
        installedAt: 'desc',
      },
    });

    return installations;
  }

  async syncInstallationRepositories(installationId: string) {
    const installation = await (
      this.prisma.gitHubInstallation as any
    ).findUnique({
      where: { id: installationId },
    });

    if (!installation) {
      throw new BadRequestException('Installation not found');
    }

    const repositories = await this.fetchInstallationRepositories(
      installation.installationId,
    );

    const users = await (this.prisma as any).gitHubInstallationUser.findMany({
      where: { installationId },
    });
    const userId = users[0]?.userId;

    if (!userId) {
      throw new BadRequestException('No user linked to this installation');
    }

    const orgName = installation.accountLogin.includes('(Personal)')
      ? installation.accountLogin
      : installation.accountType === 'Organization'
        ? installation.accountLogin
        : `${installation.accountLogin} (Personal)`;

    let organization = await this.prisma.organization.findFirst({
      where: {
        members: { some: { userId } },
        name: orgName,
      },
    });

    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: orgName,
          domain: 'github.com',
          members: { create: { userId, role: 'owner' } },
        },
      });
    }

    // Identify stale repositories that are in our DB but no longer on GitHub
    const existingRepoIdStrings = new Set(
      repositories.map((r) => r.id.toString()),
    );
    const staleRepos = await this.prisma.gitHubRepository.findMany({
      where: {
        installationId,
        repositoryId: { notIn: Array.from(existingRepoIdStrings) },
      },
    });

    if (staleRepos.length > 0) {
      console.log(
        `[GithubAppService] Pruning ${staleRepos.length} stale repositories for installation ${installationId}`,
      );
      for (const stale of staleRepos) {
        if (stale.projectId) {
          // Deleting the project will cascade down to Pipelines, Jobs, Findings AND the GitHubRepository record itself
          await this.prisma.project
            .delete({
              where: { id: stale.projectId },
            })
            .catch((err) =>
              console.error(
                `[GithubAppService] Failed to delete stale project ${stale.projectId}:`,
                err.message,
              ),
            );
        } else {
          // If no project, just delete the repo record
          await this.prisma.gitHubRepository
            .delete({
              where: { id: stale.id },
            })
            .catch(() => {});
        }
      }
    }

    for (const repo of repositories) {
      let project = await this.prisma.project.findFirst({
        where: {
          organizationId: organization.id,
          repositoryUrl: repo.full_name,
        },
      });

      if (!project) {
        project = await this.prisma.project.create({
          data: {
            organizationId: organization.id,
            userId,
            name: repo.name,
            provider: 'github',
            repositoryUrl: repo.full_name,
          },
        });
      }

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
          projectId: project.id,
          updatedAt: new Date(),
        },
        create: {
          installationId,
          repositoryId: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          projectId: project.id,
        },
      });
    }

    return { synced: repositories.length };
  }

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
    const { action, installation } = payload;

    if (action === 'deleted') {
      const dbInstallation = await this.prisma.gitHubInstallation.findUnique({
        where: { installationId: installation.id.toString() },
        include: { repositories: true },
      });

      if (dbInstallation) {
        console.log(
          `[GithubAppService] App uninstalled. Deleting ${dbInstallation.repositories.length} projects.`,
        );
        for (const repo of dbInstallation.repositories) {
          if (repo.projectId) {
            await this.prisma.project
              .delete({
                where: { id: repo.projectId },
              })
              .catch(() => {});
          }
        }

        await this.prisma.gitHubInstallation.update({
          where: { id: dbInstallation.id },
          data: { status: 'removed' },
        });
      }
    }

    return { processed: true };
  }

  private async handleInstallationRepositoriesEvent(payload: any) {
    const { action, installation, repositories_added } = payload;

    const installationRecord = await (
      this.prisma.gitHubInstallation as any
    ).findUnique({
      where: { installationId: installation.id.toString() },
    });

    if (!installationRecord) {
      console.warn(`Installation ${installation.id} not found in database`);
      return { processed: false };
    }

    if (action === 'added' && repositories_added) {
      const users = await (this.prisma as any).gitHubInstallationUser.findMany({
        where: { installationId: installationRecord.id },
      });
      const userId = users[0]?.userId;

      if (userId) {
        const orgName =
          installationRecord.accountType === 'Organization'
            ? installationRecord.accountLogin
            : `${installationRecord.accountLogin} (Personal)`;

        let organization = await this.prisma.organization.findFirst({
          where: {
            members: { some: { userId } },
            name: orgName,
          },
        });

        if (!organization) {
          organization = await this.prisma.organization.create({
            data: {
              name: orgName,
              domain: 'github.com',
              members: { create: { userId, role: 'owner' } },
            },
          });
        }

        for (const repo of repositories_added) {
          let project = await this.prisma.project.findFirst({
            where: {
              organizationId: organization.id,
              repositoryUrl: repo.full_name,
            },
          });

          if (!project) {
            project = await this.prisma.project.create({
              data: {
                organizationId: organization.id,
                userId,
                name: repo.name,
                provider: 'github',
                repositoryUrl: repo.full_name,
              },
            });
          }

          await this.prisma.gitHubRepository.create({
            data: {
              installationId: installationRecord.id,
              repositoryId: repo.id.toString(),
              name: repo.name,
              fullName: repo.full_name,
              private: repo.private,
              projectId: project.id,
            },
          });
        }
      }
    }

    if (action === 'removed' && payload.repositories_removed) {
      console.log(
        `[GithubAppService] Repositories revoked via webhook. Pruning...`,
      );
      for (const repo of payload.repositories_removed) {
        const repoRecord = await this.prisma.gitHubRepository.findUnique({
          where: {
            installationId_repositoryId: {
              installationId: installationRecord.id,
              repositoryId: repo.id.toString(),
            },
          },
        });

        if (repoRecord && repoRecord.projectId) {
          await this.prisma.project
            .delete({
              where: { id: repoRecord.projectId },
            })
            .catch(() => {});
        }
      }
    }

    return { processed: true };
  }

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

  async getInstallationTokenForRepo(
    userId: string,
    repoFullName: string,
  ): Promise<{ token: string; installationId: string }> {
    const installation = await (
      this.prisma.gitHubInstallation as any
    ).findFirst({
      where: {
        users: { some: { userId } },
        status: 'active',
        repositories: { some: { fullName: repoFullName } },
      },
    });

    if (!installation) {
      throw new BadRequestException(
        `No active GitHub App installation found for repository ${repoFullName}`,
      );
    }

    const token = await this.getInstallationAccessToken(
      installation.installationId,
    );

    return {
      token,
      installationId: installation.installationId,
    };
  }
}
