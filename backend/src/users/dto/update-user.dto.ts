import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string | null;

  @IsBoolean()
  @IsOptional()
  privacyPolicyAccepted?: boolean;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string | null;

  @IsString()
  @IsOptional()
  @IsIn(['READER', 'AUTHOR', 'EDITOR', 'MODERATOR'])
  role?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isShadowBanned?: boolean;
}
