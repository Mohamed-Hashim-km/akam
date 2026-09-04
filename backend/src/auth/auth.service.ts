import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getTransporter(): nodemailer.Transporter {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '465', 10);
    const secureConfig = this.configService.get<string>('SMTP_SECURE');
    const secure = secureConfig !== undefined ? secureConfig === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs
    await this.prisma.execute(
      `UPDATE otp_code SET used = true WHERE email = $1 AND used = false`,
      [email],
    );

    // Insert new OTP
    await this.prisma.execute(
      `INSERT INTO otp_code (id, email, code, "expiresAt", used, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, false, now())`,
      [email, code, expiresAt.toISOString()],
    );

    // Send OTP email
    try {
      const transporter = this.getTransporter();
      const fromAddress =
        this.configService.get<string>('SMTP_FROM') ||
        `"AKAM Digital" <${this.configService.get('SMTP_USER')}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Your AKAM Digital verification code',
        html: `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px 16px; background-color: #f9fafb;">
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: left;">
              <div style="margin-bottom: 20px;">
                <span style="background-color: #21B573; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; display: inline-block;">
                  AKAM DIGITAL
                </span>
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #040706; margin: 0 0 10px 0; line-height: 1.3;">
                Verify Your Email Address
              </h2>
              <p style="font-size: 14px; color: #4B5563; margin: 0 0 24px 0; line-height: 1.5;">
                Use the verification code below to sign in to your AKAM Digital account. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #040706; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 700; color: #E4F953; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 20px 0; line-height: 1.4;">
                If you did not request this verification code, you can safely ignore this email.
              </p>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
                <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
                  © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      this.logger.log(`✅ OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send OTP email to ${email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV FALLBACK] OTP for ${email}: ${code}`);
      }
    }

    return { message: 'OTP sent to your email address' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ token: string; user: object }> {
    const email = dto.email.toLowerCase().trim();

    const otp = await this.prisma.queryOne<{
      id: string;
      code: string;
    }>(
      `SELECT id, code FROM otp_code
       WHERE email = $1 AND used = false AND "expiresAt" > now()
       ORDER BY "createdAt" DESC LIMIT 1`,
      [email],
    );

    if (!otp || otp.code !== dto.code) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Mark OTP as used
    await this.prisma.execute(
      `UPDATE otp_code SET used = true WHERE id = $1`,
      [otp.id],
    );

    // Upsert user
    const user = await this.prisma.queryOne<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      bio: string | null;
      avatarUrl: string | null;
    }>(
      `INSERT INTO "user" (id, email, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'READER', now(), now())
       ON CONFLICT (email) DO UPDATE SET "updatedAt" = now()
       RETURNING id, email, name, role, bio, "avatarUrl"`,
      [email],
    );

    if (!user) {
      throw new BadRequestException('Failed to create or find user');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token, user };
  }
}
