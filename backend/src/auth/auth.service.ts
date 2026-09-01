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
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') ?? '587'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
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
      await this.transporter.sendMail({
        from: `"AKAM Digital" <${this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'Your AKAM Digital verification code',
        html: `
          <div style="font-family: 'Poppins', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb;">
            <h2 style="font-size: 24px; font-weight: 600; color: #040706; margin-bottom: 8px;">Your verification code</h2>
            <p style="color: #646464; font-size: 14px; margin-bottom: 24px;">Use this code to sign in to AKAM Digital. It expires in 10 minutes.</p>
            <div style="background: #040706; color: #E4F953; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="color: #9ca3af; font-size: 12px;">If you did not request this code, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.warn(`Failed to send OTP email to ${email}: ${(error as Error).message}`);
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV] OTP for ${email}: ${code}`);
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
