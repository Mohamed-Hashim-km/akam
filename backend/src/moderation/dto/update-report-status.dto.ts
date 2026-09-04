import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateReportStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['RESOLVED', 'DISMISSED'])
  status!: 'RESOLVED' | 'DISMISSED';
}
