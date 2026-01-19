import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FetchPipelinesDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10; // Default to 10 recent runs per workflow
}

export class FetchPipelinesParamsDto {
  @IsString()
  @IsNotEmpty()
  repoIdentifier: string; // Format: "owner/repo" or repository ID
}
