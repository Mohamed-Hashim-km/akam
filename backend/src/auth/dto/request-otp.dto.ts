import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  privacyPolicyAccepted?: boolean;
}
