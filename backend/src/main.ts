import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // Serve local static uploaded files — with CORS headers so frontend can fetch PDFs/images
  const uploadsPath = path.join(process.cwd(), 'uploads');
  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3001',
    'http://localhost:3001',
    'http://localhost:3000',
  ];
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: any, _filePath: string) => {
      const req = (res as any).req;
      const origin = req?.headers?.origin as string | undefined;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Fallback: allow the primary frontend
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      // Allow range requests for PDFs (needed by pdf.js)
      res.setHeader('Accept-Ranges', 'bytes');
    },
  });


  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3001',
      'http://localhost:3001',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('AKAM Digital API')
    .setDescription('Storytelling platform API — Authentication, Stories, Editorial Workflow, Notifications')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 AKAM Digital Backend running on: http://localhost:${port}`);
  console.log(`📂 Serving static uploads at: http://localhost:${port}/uploads/`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

await bootstrap();
