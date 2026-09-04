import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ description: 'Book Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Book Author' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiPropertyOptional({ description: 'Edition Tag (e.g. Print Edition, Hardcover)' })
  @IsString()
  @IsOptional()
  editionTag?: string;

  @ApiProperty({ description: 'Book Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Book Cover Image URL' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'External Pre-order Link URL' })
  @IsString()
  @IsOptional()
  preorderLink?: string;

  @ApiPropertyOptional({ description: 'Is Book Published' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
