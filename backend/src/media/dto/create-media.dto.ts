import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({ description: 'Video Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Video Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Category (interviews | conversations | cultural | recordings)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'YouTube Video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ)' })
  @IsString()
  @IsNotEmpty()
  youtubeUrl: string;

  @ApiPropertyOptional({ description: 'Is Published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Is Featured on Homepage' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
