import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEditionDto {
  @ApiProperty({ description: 'Edition title, e.g. "Akam September 2025"' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'URL to the uploaded PDF file' })
  @IsString()
  @IsNotEmpty()
  pdfUrl: string;

  @ApiPropertyOptional({ description: 'URL to cover image (uploaded separately)' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Whether the edition is published', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Sort order (lower = shown first)', default: 0 })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  sortOrder?: number;
}
