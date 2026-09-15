import { IsEmail } from 'class-validator';

export class CheckEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
