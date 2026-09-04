import { IsString, IsOptional, IsBoolean, MaxLength, IsHexColor } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityDto {
  @ApiProperty({ example: 'fiction-serialized-novels' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'Fiction & Serialized Novels' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Captivating multi-part stories and rich long-form fiction.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ example: '#21B573' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
