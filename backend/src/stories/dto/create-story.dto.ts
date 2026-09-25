import { IsString, IsNotEmpty, MaxLength, IsOptional, IsIn } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string; // Text content for STORY type; optional for PAINTING/VIDEO

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['STORY', 'PAINTING', 'VIDEO'])
  submissionType?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string; // For VIDEO: YouTube/Vimeo URL

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}





