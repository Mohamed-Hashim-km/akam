import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastScrollPosition?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
