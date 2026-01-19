import { IsString, IsNotEmpty } from 'class-validator';

export class GithubCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string; // Will contain userId
}
