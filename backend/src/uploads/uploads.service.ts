import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

type StorageBucket = 'avatars' | 'covers' | 'inline-images' | 'pdfs';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getAllowedMimeTypes(): string[] {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('No file provided');
    if (!this.getAllowedMimeTypes().includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed. Use JPEG, PNG, WebP, or GIF.');
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }
  }

  private validatePdfFile(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException('No file provided');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('PDF too large. Maximum size is 50MB.');
    }
  }

  async uploadPdf(
    file: Express.Multer.File,
    prefix: string,
  ): Promise<string> {
    this.validatePdfFile(file);

    const ext = '.pdf';
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanPrefix}_${Date.now()}${ext}`;

    const targetFolder = path.join(this.uploadDir, 'pdfs');
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, fileName);

    try {
      await fs.promises.writeFile(filePath, file.buffer);
      this.logger.log(`PDF saved locally to ${filePath}`);

      const backendUrl = this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3000';
      return `${backendUrl}/uploads/pdfs/${fileName}`;
    } catch (error) {
      this.logger.error('Failed to save PDF locally:', error);
      throw new BadRequestException('PDF upload failed');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: StorageBucket,
    prefix: string,
  ): Promise<string> {
    this.validateFile(file);

    const ext = path.extname(file.originalname) || '.jpg';
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanPrefix}_${Date.now()}${ext}`;

    const targetFolder = path.join(this.uploadDir, bucket);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, fileName);

    try {
      await fs.promises.writeFile(filePath, file.buffer);
      this.logger.log(`File saved locally to ${filePath}`);

      const backendUrl = this.configService.get<string>('BACKEND_URL') ?? 'http://localhost:3000';
      return `${backendUrl}/uploads/${bucket}/${fileName}`;
    } catch (error) {
      this.logger.error('Failed to save file locally:', error);
      throw new BadRequestException('File upload failed');
    }
  }
}
