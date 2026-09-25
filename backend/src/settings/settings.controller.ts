import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { SettingsService } from './settings.service.js';
import { UpdateEditorsNoteDto } from './dto/update-editors-note.dto.js';
import { CreateStudentApplicationDto, GrantStudentPassDto } from './dto/create-student-application.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';

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

  // ─── Student Verification Endpoints ──────────────────────────────────────────

  @Post('student-verifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit student ID card verification application (Public)' })
  async submitStudentApplication(@Body() dto: CreateStudentApplicationDto) {
    return this.settingsService.submitStudentApplication(dto);
  }

  @Get('student-verifications/status/:identifier')
  @ApiOperation({ summary: 'Check student verification status by referenceId or email (Public)' })
  async getStudentApplicationStatus(@Param('identifier') identifier: string) {
    const record = await this.settingsService.getStudentApplicationStatus(identifier);
    if (!record) {
      return { status: 'NONE' };
    }
    return record;
  }

  @Get('editorial/student-verifications')
  @ApiOperation({ summary: 'List all student verification applications for editorial review with pagination and filtering' })
  async getStudentApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.settingsService.getStudentApplicationsPaginated({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 9,
      status,
      search,
    });
  }

  @Post('editorial/student-verifications/grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Directly grant an approved student scholar pass (Editorial)' })
  async grantStudentPassDirectly(
    @Body() dto: GrantStudentPassDto,
  ) {
    return this.settingsService.grantStudentPassDirectly(dto, dto.reviewedBy);
  }

  @Patch('editorial/student-verifications/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a student verification application' })
  async updateStudentApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.settingsService.updateStudentApplicationStatus(
      id,
      dto.status,
      dto.reviewNotes,
      dto.reviewedBy,
      dto.endDate,
    );
  }

  @Delete('editorial/student-verifications/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a student application record' })
  async deleteStudentApplication(@Param('id') id: string) {
    return this.settingsService.deleteStudentApplication(id);
  }
}

