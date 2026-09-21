import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentApplicationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  studentIdNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  course: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  idCardUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idCardName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submittedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewedAt?: string;
}

export class GrantStudentPassDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  institution: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  studentIdNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  course: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idCardUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idCardName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;
}
