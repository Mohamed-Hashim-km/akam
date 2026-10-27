import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Sanitizes the recipient email to ensure it's a pure email address
   * without display names (e.g., "John <john@example.com>" -> "john@example.com").
   */
  private extractEmailAddress(input: string): string {
    const trimmed = (input || '').trim();
    const match = trimmed.match(/<([^>]+)>/);
    return (match ? match[1] : trimmed).toLowerCase().trim();
  }

  private getTransporter(): nodemailer.Transporter | null {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      return null;
    }

    if (!this.transporter) {
      const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
      const secureConfig = this.configService.get<string>('SMTP_SECURE');
      const secure = secureConfig !== undefined ? secureConfig === 'true' : port === 465;

      this.transporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        family: 4,
      } as any);
    }
    return this.transporter;
  }

  /**
   * Sends an email using the primary Accelr HTTP API service,
   * falling back to SMTP if configured, or development simulation.
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const toEmail = this.extractEmailAddress(options.to);
    if (!toEmail || !toEmail.includes('@')) {
      this.logger.warn(`Cannot send email: invalid recipient address "${options.to}"`);
      return false;
    }

    const defaultFromEmail =
      this.configService.get<string>('MAIL_FROM_EMAIL') ||
      this.configService.get<string>('MAIL_FROM') ||
      'no-replay@akamdigital.in';
    const defaultFromName =
      this.configService.get<string>('MAIL_FROM_NAME') || 'AKAM Digital';

    const fromEmail = options.fromEmail || defaultFromEmail;
    const fromName = options.fromName || defaultFromName;
    const formattedFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    // 1. Primary: Accelr Email API
    const rawApiKey = this.configService.get<string>('MAIL_SERVICE');
    if (rawApiKey) {
      const apiKey = rawApiKey.trim().replace(/^Bearer\s+/i, '');
      const apiUrl =
        this.configService.get<string>('MAIL_SERVICE_URL') ||
        'https://app.accelr.app/api/v1/emails/send';

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: formattedFrom,
            to: toEmail,
            subject: options.subject,
            html: options.html,
          }),
        });

        if (response.ok) {
          const resData = (await response.json().catch(() => null)) as any;
          this.logger.log(
            `✅ Email delivered via Accelr to ${toEmail} | Subject: "${options.subject}" | ID: ${resData?.data?.id || 'ok'}`,
          );
          return true;
        }

        const errBody = await response.text();
        this.logger.warn(`Accelr send failed (${response.status}): ${errBody}`);
      } catch (err) {
        this.logger.warn(`Accelr send network error: ${(err as Error).message}`);
      }
    } else {
      this.logger.warn('MAIL_SERVICE key is not configured in environment.');
    }

    // 2. Secondary Fallback: SMTP
    try {
      const transporter = this.getTransporter();
      if (transporter) {
        const smtpFrom =
          this.configService.get<string>('SMTP_FROM') ||
          `"${fromName}" <${this.configService.get('SMTP_USER') || fromEmail}>`;

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: toEmail,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        this.logger.log(
          `✅ Email delivered via SMTP fallback to ${toEmail}. MessageId: ${info.messageId}`,
        );
        return true;
      }
    } catch (smtpErr) {
      this.logger.error(
        `❌ SMTP fallback failed to send email to ${toEmail}: ${(smtpErr as Error).message}`,
        (smtpErr as Error).stack,
      );
    }

    // 3. Dev simulation if non-production
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV SIMULATION] Email to ${toEmail}: subject="${options.subject}"`);
      return true;
    }

    return false;
  }
}
