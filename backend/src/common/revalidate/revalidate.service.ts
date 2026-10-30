import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Triggers Next.js on-demand ISR revalidation on the frontend.
   * Fire-and-forget so it never blocks or fails the backend mutation.
   */
  async revalidate(tag?: string, path?: string): Promise<void> {
    try {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        process.env.FRONTEND_URL ||
        'http://localhost:3002';

      const targetPath = path || '/';
      const cleanFrontendUrl = frontendUrl.replace(/\/$/, '');
      const url = `${cleanFrontendUrl}/api/revalidate?path=${encodeURIComponent(targetPath)}${
        tag ? `&tag=${encodeURIComponent(tag)}` : ''
      }`;

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, path: targetPath }),
        signal: AbortSignal.timeout(4000),
      })
        .then(async (res) => {
          if (res.ok) {
            this.logger.log(`Frontend revalidated successfully for tag="${tag || 'all'}", path="${targetPath}"`);
          } else {
            this.logger.warn(`Frontend revalidation returned HTTP ${res.status} for ${url}`);
          }
        })
        .catch((err) => {
          this.logger.debug(`Frontend revalidation trigger failed (${url}): ${err.message}`);
        });
    } catch (e: any) {
      this.logger.debug(`RevalidateService error: ${e.message}`);
    }
  }
}
