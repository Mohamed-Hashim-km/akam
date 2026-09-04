import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityCommentDto {
  @ApiProperty({ example: 'I completely agree with this take on Malayalam poetry.' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for nested replies. Omit for root comment.' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
