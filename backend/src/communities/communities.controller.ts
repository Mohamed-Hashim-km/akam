import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Header,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service.js';
import { CreateCommunityDto } from './dto/create-community.dto.js';
import { UpdateCommunityDto } from './dto/update-community.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @ApiOperation({ summary: 'List all communities (query ?all=true to include inactive)' })
  findAll(@Query('all') all?: string) {
    return this.communitiesService.findAll(all === 'true');
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get community detail by slug' })
  findOne(@Param('slug') slug: string, @Request() req: any) {
    return this.communitiesService.findBySlug(slug, req.user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[EDITOR/ADMIN] Create a new community' })
  create(@Body() dto: CreateCommunityDto) {
    return this.communitiesService.create(dto);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[EDITOR/ADMIN] Update a community' })
  update(@Param('slug') slug: string, @Body() dto: UpdateCommunityDto) {
    return this.communitiesService.update(slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[EDITOR/ADMIN] Delete a community' })
  deleteCommunity(@Param('slug') slug: string) {
    return this.communitiesService.delete(slug);
  }

  @Post(':slug/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a community' })
  join(@Param('slug') slug: string, @Request() req: any) {
    return this.communitiesService.joinCommunity(req.user.id, slug);
  }

  @Delete(':slug/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a community' })
  leave(@Param('slug') slug: string, @Request() req: any) {
    return this.communitiesService.leaveCommunity(req.user.id, slug);
  }
}
