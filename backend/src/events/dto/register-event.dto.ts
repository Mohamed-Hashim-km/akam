import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

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
}
