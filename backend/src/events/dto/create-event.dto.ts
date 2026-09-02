import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../events.types.js';

export class CreateEventDto {
  @ApiProperty({ enum: EventType, default: EventType.READING_SESSION })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ example: 'Malayalam Creative Writing Masterclass' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'A hands-on interactive session on character development...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Calicut Town Hall & Online Stream' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: '02:00 PM' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ example: '21' })
  @IsOptional()
  @IsString()
  day?: string;

  @ApiPropertyOptional({ example: 'Oct 2026' })
  @IsOptional()
  @IsString()
  monthYear?: string;

  @ApiPropertyOptional({ example: '/images/workshops/writing-masterclass.jpg' })
  @IsOptional()
  @IsString()
  imageSrc?: string;

  @ApiPropertyOptional({ example: 'https://example.com/register' })
  @IsOptional()
  @IsString()
  registerHref?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
