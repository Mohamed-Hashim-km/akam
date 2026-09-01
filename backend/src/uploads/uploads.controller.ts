import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UploadsService } from './uploads.service.js';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload an inline image for use in rich-text story content' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInlineImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadsService.uploadFile(
      file,
      'inline-images',
      `story-${Date.now()}`,
    );
    return { url };
  }
}
