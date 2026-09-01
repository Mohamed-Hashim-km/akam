import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string; // JSON string from Tiptap/rich-text editor

  @IsOptional()
  @IsString()
  category?: string;
}
