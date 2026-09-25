import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateStudentStatusDto {
  @ApiProperty({ enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED'])
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

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
  endDate?: string;
}

