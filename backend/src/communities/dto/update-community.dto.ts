import { PartialType } from '@nestjs/swagger';
import { CreateCommunityDto } from './create-community.dto.js';

export class UpdateCommunityDto extends PartialType(CreateCommunityDto) {}
