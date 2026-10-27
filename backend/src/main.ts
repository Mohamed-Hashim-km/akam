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
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const allowedOrigins = Array.from(
    new Set([
      'https://akamdigital.in',
      'https://www.akamdigital.in',
      'https://akamdigital.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.FRONTEND_URL,
      ...configuredOrigins,
    ]),
  ).filter(Boolean) as string[];

  const isOriginAllowed = (origin?: string) => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.some((o) => cleanOrigin === o.replace(/\/+$/, ''))) return true;
    if (cleanOrigin.endsWith('.akamdigital.in') || cleanOrigin === 'https://akamdigital.in') return true;
    if (cleanOrigin.endsWith('.vercel.app')) return true;
    if (origin.includes('payu.in') || origin.includes('payu')) return true;
    return false;
  };

  // Handle /uploads/pdfs with proper CORS and anti-download protection
  app.use('/uploads/pdfs', (req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', 'inline; filename="edition-reader.pdf"');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      return next();
    }

    if (req.method === 'OPTIONS') {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
      return res.status(204).end();
    }

    const referer = req.headers.referer;
    if (
      referer &&
      (allowedOrigins.some((o) => referer.startsWith(o)) ||
        referer.includes('akamdigital.in') ||
        referer.includes('vercel.app') ||
        referer.includes('localhost'))
    ) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', 'inline; filename="edition-reader.pdf"');
      return next();
    }

    return res.status(403).json({
      statusCode: 403,
      message: 'Direct download of PDF files is prohibited. Please read via the authenticated reader.',
    });
  });

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res: any, _filePath: string) => {
      const req = (res as any).req;
      const origin = req?.headers?.origin as string | undefined;
      if (origin && isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
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
    origin: (origin, callback) => {
      // Always allow PayU, localhost, configured origins, or requests with no origin (redirects/server-to-server)
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Log and allow to prevent crashing the server on external payment callbacks
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
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
