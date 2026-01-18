import { IsString, IsNotEmpty } from 'class-validator';

export class AuthorizeGithubDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  redirectUri?: string; // Optional: frontend callback URL
}
