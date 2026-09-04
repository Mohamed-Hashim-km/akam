import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewStoryDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionNote?: string;
}
