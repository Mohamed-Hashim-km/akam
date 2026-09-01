import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
