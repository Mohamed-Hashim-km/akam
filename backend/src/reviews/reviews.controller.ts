import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  @ApiOperation({ summary: 'Get all published reader reviews and testimonials for homepage display' })
  async getPublishedReviews() {
    return this.reviewsService.findAllPublished();
  }

  @Get('editorial/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated reader reviews for editorial dashboard management' })
  async getEditorialReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.reviewsService.findAllEditorialPaginated(page, limit, search);
  }

  @Post('editorial/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reader review/testimonial' })
  async createReview(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Patch('editorial/reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing reader review' })
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, dto);
  }

  @Patch('editorial/reviews/:id/toggle-publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle published status of a reader review' })
  async togglePublishReview(@Param('id') id: string) {
    return this.reviewsService.togglePublish(id);
  }

  @Delete('editorial/reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a reader review' })
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
