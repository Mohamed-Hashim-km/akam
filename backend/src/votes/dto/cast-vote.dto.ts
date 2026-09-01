import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VoteValue {
  UP = 'UP',
  DOWN = 'DOWN',
}

export class CastVoteDto {
  @ApiProperty({ enum: VoteValue, example: 'UP' })
  @IsEnum(VoteValue)
  value: VoteValue;
}
