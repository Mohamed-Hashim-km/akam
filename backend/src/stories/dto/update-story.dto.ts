import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['STORY', 'PAINTING', 'VIDEO'])
  submissionType?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
