export class CreateProjectDto {
  organizationId: string;
  name: string;
  provider: string; // 'github', 'gitlab', etc.
  repositoryUrl: string;
  repoData: any; // provider-specific repo data
}
