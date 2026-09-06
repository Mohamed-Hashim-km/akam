import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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
import { CreateAuthorDto } from './dto/create-author.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get('featured')
  @ApiOperation({ summary: 'Get all featured authors for Masika journal with pagination' })
  async getFeaturedAuthors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.findFeaturedAuthors(pageNum, limitNum);
  }

  @Get('featured-authors')
  @ApiOperation({ summary: 'Get all featured authors for Masika journal with pagination' })
  async getFeaturedAuthorsAlias(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.findFeaturedAuthors(pageNum, limitNum);
  }

  @Get('public-authors')
  @ApiOperation({ summary: 'Get all platform authors with pagination' })
  async getPublicAuthors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.findPublicAuthors(pageNum, limitNum);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update display name and bio' })
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade account to AUTHOR role to enable story creation' })
  async becomeAuthor(@CurrentUser() user: AuthUser) {
    return this.usersService.becomeAuthor(user.id);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Update user role' })
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/toggle-featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Toggle user Masika featured author status' })
  async toggleFeatured(@Param('id') id: string) {
    return this.usersService.toggleFeatured(id);
  }

  @Patch(':id/sort-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Update user priority sort order' })
  async updateSortOrder(@Param('id') id: string, @Body('sortOrder') sortOrder: number) {
    const val = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder || '0', 10);
    return this.usersService.updateSortOrder(id, isNaN(val) ? 0 : val);
  }

  @Post('create-author')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Create or elevate user as Author' })
  async createAuthor(@Body() dto: CreateAuthorDto) {
    return this.usersService.createAuthorByAdmin(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Update user or author details' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Delete user or author account and cleanup files' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

