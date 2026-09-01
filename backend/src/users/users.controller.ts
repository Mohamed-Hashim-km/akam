import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Get all registered users' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.findAll(pageNum, limitNum, search);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update display name and bio' })
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.uploadsService.uploadFile(file, 'avatars', user.id);
    return this.usersService.updateAvatar(user.id, url);
  }

  @Post('me/become-author')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade account to AUTHOR role to enable story creation' })
  async becomeAuthor(@CurrentUser() user: AuthUser) {
    return this.usersService.becomeAuthor(user.id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Update user role' })
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }
}
