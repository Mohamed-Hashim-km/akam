import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { CheckEmailDto } from './dto/check-email.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) { }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async checkEmail(dto: CheckEmailDto): Promise<{
    exists: boolean;
    name: string | null;
    phone: string | null;
    requiresDetails: boolean;
    hasPhone: boolean;
    hasConsent: boolean;
    otpSent?: boolean;
    message?: string;
  }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.queryOne<{
      id: string;
      name: string | null;
      phone: string | null;
      privacyPolicyAccepted: boolean | null;
    }>(
      `SELECT id, name, phone, "privacyPolicyAccepted" FROM "user" WHERE LOWER(email) = $1`,
      [email],
    );

    const hasPhone = Boolean(user?.phone && user.phone.trim().length >= 8);
    const hasConsent = Boolean(user?.privacyPolicyAccepted);
    const requiresDetails = !user || !hasPhone || !hasConsent;

    let otpSent = false;
    let message: string | undefined;

    // Fast-path: If autoSendOtp is enabled and user doesn't require details, generate & dispatch OTP in same request!
    if (dto.autoSendOtp && !requiresDetails) {
      await this.requestOtp({ email });
      otpSent = true;
      message = 'Verification code sent to your email!';
    }

    return {
      exists: !!user,
      name: user?.name || null,
      phone: user?.phone || null,
      requiresDetails,
      hasPhone,
      hasConsent,
      otpSent,
      message,
    };
  }

  /**
   * Dispatches the verification email asynchronously in the background.
   */
  private async sendOtpEmail(email: string, code: string): Promise<void> {
    const logoUrl = 'https://akamdigital.in/images/akamdigital.png';
    const frontendUrl = 'https://akamdigital.in';
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AKAM Digital Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #040706;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);">
                
                <!-- Brand Header with Navbar Logo -->
                <tr>
                  <td style="background-color: #FFFFFF; padding: 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
                    <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="AKAM Digital" style="height: 44px; width: auto; max-width: 220px; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>

                <!-- Gradient Ribbon -->
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 36px 32px 28px 32px; text-align: left;">
                    <div style="margin-bottom: 14px;">
                      <span style="display: inline-block; background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px;">
                        Security Verification
                      </span>
                    </div>

                    <h2 style="font-size: 22px; font-weight: 800; color: #040706; margin: 0 0 10px 0; line-height: 1.3; letter-spacing: -0.3px;">
                      Verify Your Email Address
                    </h2>
                    <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                      Use the single-use verification code below to access your AKAM Digital account. This code is valid for <strong style="color: #040706;">10 minutes</strong>.
                    </p>

                    <!-- OTP Code Box -->
                    <div style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                      <div style="font-size: 11px; font-weight: 700; color: #21B573; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                        ONE-TIME VERIFICATION CODE
                      </div>
                      <span style="font-size: 34px; font-weight: 800; color: #040706; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; display: inline-block;">
                        ${code}
                      </span>
                    </div>

                    <p style="font-size: 12px; color: #64748B; margin: 0; line-height: 1.5;">
                      If you did not request this verification code, please safely ignore this email. Never share this code with anyone.
                    </p>
                  </td>
                </tr>

                <!-- Footer with Privacy Policy, Terms & Automation Notice -->
                <tr>
                  <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                      <em>This is an automated email. Please do not reply directly to this message.</em>
                    </p>
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #334155;">
                      AKAM Digital • India's First Digital Literary Platform
                    </p>
                    <p style="margin: 0 0 10px 0;">
                      <a href="${frontendUrl}/privacy-policy" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Privacy Policy</a>
                      •
                      <a href="${frontendUrl}/terms" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Terms of Service</a>
                      •
                      <a href="${frontendUrl}" style="color: #64748B; text-decoration: none; margin: 0 8px;">akamdigital.in</a>
                    </p>
                    <p style="margin: 0; font-size: 10px; color: #94A3B8;">
                      © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.mailService.sendMail({
      to: email,
      subject: `${code} is your AKAM Digital verification code`,
      html: htmlTemplate,
      fromName: 'AKAM Digital',
    });
  }

  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase().trim();
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.logger.log(`🔑 [OTP] Generated OTP for ${email}: ${code}`);

    // Invalidate previous unused OTPs and insert the new OTP in parallel
    await Promise.all([
      this.prisma.execute(
        `UPDATE otp_code SET used = true WHERE email = $1 AND used = false`,
        [email],
      ),
      this.prisma.execute(
        `INSERT INTO otp_code (id, email, code, "expiresAt", used, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, false, now())`,
        [email, code, expiresAt.toISOString()],
      ),
    ]);

    // Send email asynchronously in background — returns immediately to client in ~25ms!
    this.sendOtpEmail(email, code).catch((err) => {
      this.logger.error(`Background OTP email error for ${email}: ${err?.message}`);
    });

    return { message: 'Verification code sent to your email address' };
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

    const name = dto.name?.trim() || null;
    const phone = dto.phone?.trim() || null;
    const privacyPolicyAccepted = dto.privacyPolicyAccepted === true;

    // Upsert user with name, phone and privacyPolicyAccepted
    const user = await this.prisma.queryOne<{
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      privacyPolicyAccepted: boolean;
      role: string;
      bio: string | null;
      avatarUrl: string | null;
    }>(
      `INSERT INTO "user" (id, email, name, phone, "privacyPolicyAccepted", role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'READER', now(), now())
       ON CONFLICT (email) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, "user".name),
         phone = COALESCE(EXCLUDED.phone, "user".phone),
         "privacyPolicyAccepted" = CASE WHEN EXCLUDED."privacyPolicyAccepted" = true THEN true ELSE "user"."privacyPolicyAccepted" END,
         "updatedAt" = now()
       RETURNING id, email, name, phone, "privacyPolicyAccepted", role, bio, "avatarUrl"`,
      [email, name, phone, privacyPolicyAccepted],
    );

    if (!user) {
      throw new BadRequestException('Failed to create or find user');
    }

    // Fetch subscription status to include in login response
    let sub = await this.prisma.queryOne<{
      status: string;
      endDate: Date;
      isStudent: boolean;
    }>(
      `SELECT status, "endDate", "isStudent" FROM subscription WHERE "userId" = $1`,
      [user.id],
    );

    // Auto-activate only if no subscription record exists and user has an approved student application
    if (!sub && user.email) {
      const applicationsRow = await this.prisma.queryOne<{ value: any }>(
        `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
      );
      if (applicationsRow?.value && Array.isArray(applicationsRow.value)) {
        const hasApproved = applicationsRow.value.some(
          (app: any) =>
            app.status === 'APPROVED' &&
            app.email &&
            app.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        if (hasApproved) {
          sub = await this.prisma.queryOne<{
            status: string;
            endDate: Date;
            isStudent: boolean;
          }>(
            `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "createdAt", "updatedAt")
             VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), now() + interval '6 months', true, now(), now())
             ON CONFLICT ("userId") DO UPDATE
               SET status      = 'ACTIVE',
                   "startDate" = now(),
                   "endDate"   = now() + interval '6 months',
                   "isStudent" = true,
                   "updatedAt" = now()
             RETURNING status, "endDate", "isStudent"`,
            [user.id],
          );
        }
      }
    }

    const subIsActive = sub && sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date();

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        ...user,
        subscriptionStatus: subIsActive ? 'ACTIVE' : (sub ? 'EXPIRED' : null),
        subscriptionEndDate: subIsActive && sub ? new Date(sub.endDate).toISOString() : null,
        isStudent: Boolean(subIsActive && sub?.isStudent),
      },
    };
  }
}
