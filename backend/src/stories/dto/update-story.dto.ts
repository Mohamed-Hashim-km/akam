import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
