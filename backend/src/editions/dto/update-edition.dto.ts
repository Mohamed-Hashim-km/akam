import { PartialType } from '@nestjs/swagger';
import { CreateEditionDto } from './create-edition.dto.js';

export class UpdateEditionDto extends PartialType(CreateEditionDto) {}
