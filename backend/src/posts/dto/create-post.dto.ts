import {
  IsString,
  IsOptional,
  IsUrl,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PostFlair {
  DISCUSSION = 'DISCUSSION',
  QUESTION = 'QUESTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  RESOURCE = 'RESOURCE',
  FEEDBACK = 'FEEDBACK',
}

export class CreatePostDto {
  @ApiProperty({ example: 'What are the best serialized novels of 2025?' })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: "I've been reading... what are your favorites?" })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: PostFlair, default: PostFlair.DISCUSSION })
  @IsOptional()
  @IsEnum(PostFlair)
  flair?: PostFlair;
}
