import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewStoryDto {
  @IsEnum(['APPROVED', 'REJECTED', 'APPROVED_EMAGAZINE', 'PENDING', 'UNPUBLISHED'])
  decision: 'APPROVED' | 'REJECTED' | 'APPROVED_EMAGAZINE' | 'PENDING' | 'UNPUBLISHED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionNote?: string;
}
