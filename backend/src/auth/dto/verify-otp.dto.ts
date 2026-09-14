import { IsEmail, IsString, Length, IsOptional, IsBoolean } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  privacyPolicyAccepted?: boolean;
}
