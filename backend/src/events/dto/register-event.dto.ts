import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class RegisterEventDto {
  @ApiProperty({ description: 'Full name of attendee' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Notes or questions for speakers' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'PayU Transaction ID for paid registrations' })
  @IsOptional()
  @IsString()
  txnId?: string;

  @ApiPropertyOptional({ description: 'Amount paid in INR' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Whether registration is paid' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Payment status (e.g. FREE, COMPLETED, PENDING)' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;
}
