import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SettingsService } from './settings.service.js';
import { UpdateEditorsNoteDto } from './dto/update-editors-note.dto.js';

@ApiTags('Settings')
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings/editors-note')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
  @ApiOperation({ summary: 'Get current Editor Note (Public)' })
  async getEditorsNote() {
    return this.settingsService.getEditorsNote();
  }

  @Patch('editorial/settings/editors-note')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] Update Editor Note content and image' })
  async updateEditorsNote(@Body() dto: UpdateEditorsNoteDto) {
    return this.settingsService.updateEditorsNote(dto);
  }
}
