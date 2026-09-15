import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewStoryDto {
  @IsEnum(['APPROVED', 'REJECTED', 'APPROVED_EMAGAZINE', 'PENDING'])
  decision: 'APPROVED' | 'REJECTED' | 'APPROVED_EMAGAZINE' | 'PENDING';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionNote?: string;
}
