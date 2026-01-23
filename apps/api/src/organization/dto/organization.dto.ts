import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  domain: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class InviteMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RespondToRequestDto {
  @IsBoolean()
  accept: boolean;
}
