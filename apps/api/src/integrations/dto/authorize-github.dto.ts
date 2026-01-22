import { IsString, IsNotEmpty } from 'class-validator';

export class AuthorizeGithubDto {
  @IsString()
  redirectUri?: string; // Optional: frontend callback URL
}
