import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateReportStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['RESOLVED', 'DISMISSED', 'DISPUTED'])
  status!: 'RESOLVED' | 'DISMISSED' | 'DISPUTED';

  @IsOptional()
  @IsString()
  @IsIn(['RESTORE', 'UNPUBLISH', 'DISMISS'])
  action?: 'RESTORE' | 'UNPUBLISH' | 'DISMISS';

  @IsOptional()
  @IsString()
  editorialNote?: string;
}

