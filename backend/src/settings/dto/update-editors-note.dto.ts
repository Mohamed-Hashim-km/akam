import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEditorsNoteDto {
  @ApiPropertyOptional({ example: "Editor's Note" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: "This month we celebrate the voices shaping Malayalam literature..." })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: "/images/home/editorialNot.webp" })
  @IsOptional()
  @IsString()
  bgImageSrc?: string;
}
