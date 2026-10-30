import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const TARGET_EMAIL = 'hashimhx3@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://akamdigital.in';
const LOGO_URL = 'https://akamdigital.in/images/akamdigital.png';

const rawApiKey = process.env.MAIL_SERVICE;
const apiKey = rawApiKey ? rawApiKey.trim().replace(/^Bearer\s+/i, '') : null;
const apiUrl = process.env.MAIL_SERVICE_URL || 'https://app.accelr.app/api/v1/emails/send';
const defaultFromEmail = process.env.MAIL_FROM_EMAIL || 'no-replay@akamdigital.in';
const defaultFromName = process.env.MAIL_FROM_NAME || 'AKAM Digital';

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, fromName }) {
  const name = fromName || defaultFromName;
  const from = `${name} <${defaultFromEmail}>`;

  // 1. Accelr
  if (apiKey) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        console.log(`[ACCELR SUCCESS] "${subject}" -> ID: ${data?.data?.id || 'ok'}`);
        return true;
      }
      console.warn(`[ACCELR WARN] HTTP ${response.status}: ${await response.text()}`);
    } catch (err) {
      console.warn(`[ACCELR ERROR] ${err.message}`);
    }
  }

  // 2. SMTP fallback
  try {
    const tp = getTransporter();
    const info = await tp.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[SMTP SUCCESS] "${subject}" -> MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[SMTP ERROR] "${subject}": ${err.message}`);
    return false;
  }
}

// ─── Common Footer Generator ───────────────────────────────────────────────
function buildCommonFooter() {
  return `
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 26px 32px; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B; font-weight: 500;">
          <em>This is an automated email. Please do not reply directly to this message.</em>
        </p>
        <p style="margin: 0 0 10px 0; font-weight: 700; color: #334155;">
          AKAM Digital • India's First Digital Literary Platform
        </p>
        <p style="margin: 0 0 10px 0;">
          <a href="${FRONTEND_URL}/privacy-policy" style="color: #21B573; text-decoration: underline; margin: 0 8px; font-weight: 600;">Privacy Policy</a>
          •
          <a href="${FRONTEND_URL}/terms" style="color: #21B573; text-decoration: underline; margin: 0 8px; font-weight: 600;">Terms of Service</a>
          •
          <a href="${FRONTEND_URL}" style="color: #64748B; text-decoration: none; margin: 0 8px;">akamdigital.in</a>
        </p>
        <p style="margin: 0; font-size: 10px; color: #94A3B8;">
          © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
        </p>
      </td>
    </tr>
  `;
}

// ─── 1. OTP Verification Template ──────────────────────────────────────────
function buildOtpTemplate(code) {
  return `
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
                  <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="${LOGO_URL}" alt="AKAM Digital" style="height: 44px; width: auto; max-width: 220px; display: block; border: 0;" />
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

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── 2 & 3. Subscription Granted Templates ─────────────────────────────────
function buildSubscriptionTemplate(isStudent, months, note) {
  const planTitle = isStudent
    ? `${months}-Month Complimentary Scholar Pass`
    : `${months}-Month Full Access Subscription`;

  const endDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(endDate);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isStudent ? 'Scholar Pass Active' : 'Subscription Active'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #040706;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
              
              <!-- Brand Header with Navbar Logo -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
                  <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="${LOGO_URL}" alt="AKAM Digital Logo" style="height: 48px; width: auto; max-width: 230px; display: block; border: 0;" />
                  </a>
                </td>
              </tr>

              <!-- Gradient Ribbon -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
              </tr>

              <!-- Hero Section -->
              <tr>
                <td style="padding: 36px 32px 20px 32px; text-align: center;">
                  <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #ECFDF5; border: 2px solid #21B573; font-size: 30px; text-align: center; margin-bottom: 16px;">
                    ${isStudent ? '🎓' : '🌟'}
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="display: inline-block; background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 9999px;">
                      ${isStudent ? 'Scholar Access Active' : 'All-Access Active'}
                    </span>
                  </div>
                  <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                    ${isStudent ? 'Scholar Pass Granted!' : 'Subscription Granted!'}
                  </h2>
                  <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
                    Dear <strong style="color: #040706;">Hashim</strong>, your digital reading pass has been granted by the AKAM Digital editorial desk. You have full, unlimited access to our complete literary catalog.
                  </p>
                </td>
              </tr>

              ${note
      ? `<!-- Editorial Note Card -->
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #21B573; border-radius: 14px; padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                      MESSAGE FROM EDITORIAL DESK
                    </div>
                    <p style="font-size: 13px; color: #166534; margin: 0; line-height: 1.6; font-style: italic;">
                      &ldquo;${note}&rdquo;
                    </p>
                  </div>
                </td>
              </tr>`
      : ''
    }

              <!-- Details Table -->
              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden;">
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B; width: 40%;">
                        Recipient Account
                      </td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 700; color: #040706;">
                        ${TARGET_EMAIL}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                        Membership Pass
                      </td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #1E293B;">
                        ${planTitle}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                        Valid Until
                      </td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 700; color: #21B573;">
                        ${formattedDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; font-size: 12px; color: #64748B;">
                        Access Status
                      </td>
                      <td style="padding: 13px 18px; font-size: 12px; font-weight: 700;">
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;">
                          ✓ ACTIVE • UNLIMITED ACCESS
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 32px 36px 32px; text-align: center;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="${FRONTEND_URL}/library"
                           style="display: inline-block; background-color: #21B573; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25); text-transform: uppercase;">
                          Access Digital Library & Read Now →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── 4 & 5. Story Published Templates ──────────────────────────────────────
function buildStoryPublishedTemplate(type) {
  const isEmagazine = type === 'EMAGAZINE';
  const messageHeading = isEmagazine
    ? 'Published in AKAM Magazine Edition!'
    : 'Published on AKAM Digital Works Catalog!';

  const messageBody = isEmagazine
    ? 'We are delighted to inform you that your curated submission <strong>"The River at Twilight"</strong> has been officially published in the AKAM Digital Magazine edition.'
    : 'We are pleased to inform you that your story <strong>"The River at Twilight"</strong> has been approved and published to the live public works catalog on AKAM Digital.';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${messageHeading}</title>
    </head>
    <body style="font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 40px 16px; -webkit-font-smoothing: antialiased; color: #040706;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
                  <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="${LOGO_URL}" alt="AKAM Digital" style="height: 46px; width: auto; max-width: 220px; display: block; border: 0;" />
                  </a>
                </td>
              </tr>

              <!-- Gradient Ribbon -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
              </tr>

              <!-- Hero Section -->
              <tr>
                <td style="padding: 36px 32px 18px 32px; text-align: center;">
                  <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background-color: #ECFDF5; border: 2px solid #21B573; font-size: 28px; text-align: center; margin-bottom: 14px;">
                    🎉
                  </div>
                  <div>
                    <span style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;">
                      ${isEmagazine ? 'AKAM Magazine Edition' : 'AKAM Live Works Catalog'}
                    </span>
                  </div>
                  <h1 style="color: #040706; font-size: 22px; margin: 0 0 10px 0; font-weight: 800; letter-spacing: -0.5px;">
                    ${messageHeading}
                  </h1>
                </td>
              </tr>

              <!-- Content Area -->
              <tr>
                <td style="padding: 0 32px 32px 32px; color: #475569; line-height: 1.6;">
                  <p style="margin: 0 0 16px; font-size: 14px;">Dear <strong style="color: #040706;">Hashim</strong>,</p>
                  <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">${messageBody}</p>
                  
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #21B573; border-radius: 14px; padding: 18px 20px; margin: 20px 0;">
                    <div style="font-size: 16px; font-weight: 700; color: #040706;">The River at Twilight</div>
                  </div>

                  <p style="margin: 0 0 24px; font-size: 14px;">Thank you for contributing to AKAM Digital and sharing your creative voice with our reader community across India and worldwide.</p>
                  
                  <div style="text-align: center; margin: 28px 0 8px 0;">
                    <a href="${FRONTEND_URL}/profile" style="display: inline-block; background-color: #21B573; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25);">
                      View on Your Profile →
                    </a>
                  </div>
                </td>
              </tr>

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── 6 & 7. Event Registration Templates ───────────────────────────────────
function buildEventRegistrationTemplate(isPaid) {
  const event = {
    title: 'Literary Conclave 2026: The Architecture of Memory',
    day: '15',
    monthYear: 'November 2026',
    time: '10:00 AM - 01:30 PM IST',
    location: 'Kerala Arts Hall, Calicut & Live Stream',
    type: 'ANNUAL LIT FEST',
    description: 'Join distinguished authors, poets, and critics for an intimate session reflecting on historical narratives in contemporary Indian literature.',
  };

  const amount = isPaid ? 499 : 0;
  const passId = isPaid ? 'AKAM-EVT-PAID-8821' : 'AKAM-EVT-FREE-3419';

  const badgeText = isPaid ? 'PAID ADMISSION CONFIRMED' : 'COMPLIMENTARY PASS CONFIRMED';
  const badgeBg = '#ECFDF5';
  const badgeColor = '#A7F3D0';
  const badgeTextColor = '#065F46';

  const statusPill = isPaid
    ? `<span style="display: inline-block; padding: 4px 10px; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #065F46; letter-spacing: 0.5px;">PAID • ₹${amount}</span>`
    : `<span style="display: inline-block; padding: 4px 10px; background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #334155; letter-spacing: 0.5px;">FREE ADMISSION</span>`;

  const paymentRow = isPaid
    ? `
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Ticket Amount</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #040706; font-weight: 700; border-bottom: 1px solid #F1F5F9; text-align: right;">₹${amount}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Payment Status</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #16A34A; font-weight: 700; border-bottom: 1px solid #F1F5F9; text-align: right;">COMPLETED (PayU Verified)</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Transaction ID</td>
        <td style="padding: 10px 14px; font-size: 12px; font-family: monospace; color: #334155; font-weight: 600; border-bottom: 1px solid #F1F5F9; text-align: right;">TXN-PAYU-9823194</td>
      </tr>
    `
    : `
      <tr>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Admission Type</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #040706; font-weight: 700; border-bottom: 1px solid #F1F5F9; text-align: right;">Complimentary / Free Entry</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Confirmed: ${event.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #040706;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 22px 28px; text-align: left; border-bottom: 3px solid #21B573;">
                  <table width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                          <img src="${LOGO_URL}" alt="AKAM Digital" style="height: 44px; width: auto; max-width: 200px; display: block; border: 0;" />
                        </a>
                      </td>
                      <td align="right">
                        <span style="background-color: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; letter-spacing: 1px; text-transform: uppercase;">
                          ${event.type}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Gradient Ribbon -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding: 32px;">
                  <div style="margin-bottom: 16px;">
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeColor}; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; letter-spacing: 0.8px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </div>

                  <h1 style="font-size: 24px; font-weight: 800; color: #040706; margin: 0 0 10px 0; line-height: 1.25; letter-spacing: -0.5px;">
                    ${event.title}
                  </h1>

                  <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                    Hello <strong>Hashim</strong>, your spot for this event has been successfully registered. Please find your event pass and schedule details below.
                  </p>

                  <!-- Pass Box -->
                  <div style="background-color: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 12px; border-bottom: 1px solid #E2E8F0;">
                          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">
                            Registration Pass Number
                          </div>
                          <div style="font-size: 16px; font-weight: 800; font-family: monospace; color: #040706; margin-top: 2px;">
                            ${passId}
                          </div>
                        </td>
                        <td align="right" style="padding-bottom: 12px; border-bottom: 1px solid #E2E8F0;">
                          ${statusPill}
                        </td>
                      </tr>

                      <tr>
                        <td colspan="2" style="padding-top: 14px;">
                          <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 6px 0; vertical-align: middle;">
                                <div style="font-size: 11px; color: #64748B; font-weight: 600;">DATE</div>
                                <div style="font-size: 13px; color: #040706; font-weight: 700;">${event.day} ${event.monthYear}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; vertical-align: middle;">
                                <div style="font-size: 11px; color: #64748B; font-weight: 600;">TIME</div>
                                <div style="font-size: 13px; color: #040706; font-weight: 700;">${event.time}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 6px 0; vertical-align: middle;">
                                <div style="font-size: 11px; color: #64748B; font-weight: 600;">VENUE / LOCATION</div>
                                <div style="font-size: 13px; color: #040706; font-weight: 700;">${event.location}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Summary Table -->
                  <table width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                    <tr style="background-color: #F8FAFC;">
                      <th colspan="2" style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0;">
                        Registration & Attendee Summary
                      </th>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Attendee</td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #040706; font-weight: 700; border-bottom: 1px solid #F1F5F9; text-align: right;">Hashim</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #F1F5F9;">Email</td>
                      <td style="padding: 10px 14px; font-size: 13px; color: #040706; font-weight: 500; border-bottom: 1px solid #F1F5F9; text-align: right;">${TARGET_EMAIL}</td>
                    </tr>
                    ${paymentRow}
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 32px 0 24px 0;">
                    <a href="${FRONTEND_URL}/events" target="_blank" style="display: inline-block; background-color: #21B573; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 800; padding: 14px 32px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25); text-transform: uppercase;">
                      View Event on AKAM Digital →
                    </a>
                  </div>
                </td>
              </tr>

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── 8 & 9. Student Pass Approved / Rejected Templates ─────────────────────
function buildStudentStatusTemplate(isApproved) {
  const referenceId = 'AKAM-STU-2026-98124';
  const effectiveNotes = isApproved
    ? 'Your student credentials have been verified. You now have full, complimentary access to AKAM Digital editions and monthly literary issues.'
    : 'Uploaded identity card image is blurry or expired. Please upload a clear photo displaying your valid academic year.';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isApproved ? 'Student Pass Approved' : 'Student Verification Update'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 24px 28px; text-align: center; border-bottom: 3px solid #21B573;">
                  <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img src="${LOGO_URL}" alt="AKAM Digital Logo" style="height: 48px; width: auto; max-width: 230px; display: block; border: 0;" />
                  </a>
                </td>
              </tr>

              <!-- Gradient Ribbon -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
              </tr>

              <!-- Sub Header Strip -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 14px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
                  <div style="display: inline-block; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 9999px; padding: 5px 16px;">
                    <span style="color: #065F46; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                      AKAM DIGITAL • SCHOLAR ACCESS
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Hero Decision Section -->
              <tr>
                <td style="padding: 36px 32px 24px 32px; text-align: center;">
                  ${isApproved
      ? `
                    <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 50%; background: #ECFDF5; border: 2px solid #21B573; font-size: 32px; text-align: center; margin-bottom: 18px;">
                      🎓
                    </div>
                    <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                      Verification Approved!
                    </h2>
                    <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 460px; line-height: 1.6;">
                      Dear <strong style="color: #040706;">Hashim</strong>, congratulations! Your student credentials have been verified by the editorial board. Your <strong style="color: #21B573;">100% Free Scholar Pass</strong> is now active.
                    </p>
                  `
      : `
                    <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 50%; background: #FFF1F2; border: 2px solid #F43F5E; font-size: 30px; text-align: center; margin-bottom: 18px;">
                      📋
                    </div>
                    <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                      Verification Status Update
                    </h2>
                    <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 460px; line-height: 1.6;">
                      Dear <strong style="color: #040706;">Hashim</strong>, thank you for your interest in AKAM Digital. After editorial review, your student identity verification could not be approved at this stage.
                    </p>
                  `
    }
                </td>
              </tr>

              <!-- Feedback Note Card -->
              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <div style="background-color: ${isApproved ? '#F0FDF4' : '#FFF1F2'}; border: 1px solid ${isApproved ? '#BBF7D0' : '#FECDD3'}; border-radius: 16px; padding: 20px 22px;">
                    <div style="font-size: 10px; font-weight: 800; color: ${isApproved ? '#166534' : '#9F1239'}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      ${isApproved ? 'EDITORIAL BOARD WELCOME NOTE' : 'REASON & EDITORIAL GUIDANCE'}
                    </div>
                    <p style="font-size: 13px; color: ${isApproved ? '#15803D' : '#BE123C'}; margin: 0; line-height: 1.6; font-style: italic;">
                      &ldquo;${effectiveNotes}&rdquo;
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Details Table -->
              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B; width: 40%;">Applicant Name</td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #040706;">Hashim</td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">College / Institution</td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #334155;">University of Calicut</td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">Application Reference</td>
                      <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #21B573; font-family: monospace;">${referenceId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 13px 18px; font-size: 12px; color: #64748B;">Current Status</td>
                      <td style="padding: 13px 18px; font-size: 12px; font-weight: 700;">
                        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; ${isApproved
      ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;'
      : 'background-color: #FFF1F2; color: #9F1239; border: 1px solid #FECDD3;'
    }">
                          ${isApproved ? '✓ APPROVED • 100% FREE SCHOLAR PASS' : '✕ REJECTED • RESUBMISSION WELCOME'}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 32px 32px 32px; text-align: center;">
                  <a href="${isApproved ? `${FRONTEND_URL}/library` : `${FRONTEND_URL}/plans`}"
                     style="display: inline-block; background-color: #21B573; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25); text-transform: uppercase;">
                    ${isApproved ? 'Access Digital Library & Read Now →' : 'Resubmit ID Card Verification →'}
                  </a>
                </td>
              </tr>

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── 10. Editorial Alert Template ──────────────────────────────────────────
function buildEditorialAlertTemplate() {
  const reviewUrl = `${FRONTEND_URL}/editorial?tab=subscriptions&subTab=verifications&page=1`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Student Scholar Pass Application</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 22px 28px; text-align: left; border-bottom: 3px solid #21B573;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <a href="${FRONTEND_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                          <img src="${LOGO_URL}" alt="AKAM Digital" style="height: 44px; width: auto; max-width: 220px; display: block; border: 0;" />
                        </a>
                      </td>
                      <td align="right">
                        <span style="background-color: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; letter-spacing: 1px; text-transform: uppercase;">
                          EDITORIAL DESK
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Gradient Ribbon -->
              <tr>
                <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
              </tr>

              <!-- Content Area -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="color: #040706; margin: 0 0 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                    New Student Scholar Pass Application
                  </h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
                    A student has submitted their credentials for a 100% Free Scholar Pass. Please review their submitted identity card in the editorial management panel.
                  </p>

                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; margin-bottom: 24px; font-size: 13px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-weight: 700; width: 35%;">Applicant:</td>
                        <td style="padding: 8px 0; color: #040706; font-weight: 600;">Hashim</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Institution:</td>
                        <td style="padding: 8px 0; color: #334155;">University of Calicut</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Email:</td>
                        <td style="padding: 8px 0; color: #334155;">${TARGET_EMAIL}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Reference ID:</td>
                        <td style="padding: 8px 0; color: #21B573; font-family: monospace; font-weight: 700;">AKAM-STU-2026-98124</td>
                      </tr>
                    </table>
                  </div>

                  <div style="text-align: center; margin-top: 24px;">
                    <a href="${reviewUrl}" style="display: inline-block; background-color: #21B573; color: #FFFFFF; text-decoration: none; padding: 14px 34px; font-weight: 800; border-radius: 9999px; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25);">
                      Open Student Verifications Panel →
                    </a>
                  </div>
                </td>
              </tr>

              ${buildCommonFooter()}

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ─── Dispatch All 10 Templates ─────────────────────────────────────────────
async function main() {
  console.log(`Starting delivery of all 10 White-Themed Email Templates to ${TARGET_EMAIL}...`);

  const tests = [
    {
      subject: '1/10: [White Theme] Verify Your Email Address - 849201',
      html: buildOtpTemplate('849201'),
      fromName: 'AKAM Digital Security',
    },
    {
      subject: '2/10: [White Theme] Welcome to AKAM Digital: Your 12-Month Subscription is Active!',
      html: buildSubscriptionTemplate(false, 12, 'Thank you for supporting modern Malayalam literature!'),
      fromName: 'AKAM Digital Subscriptions',
    },
    {
      subject: '3/10: [White Theme] Welcome to AKAM Digital: Your Scholar Pass is Active!',
      html: buildSubscriptionTemplate(true, 12, 'Congratulations on your scholarship verification! Happy reading.'),
      fromName: 'AKAM Digital Scholar Desk',
    },
    {
      subject: '4/10: [White Theme] Your story "The River at Twilight" has been published on AKAM Digital!',
      html: buildStoryPublishedTemplate('WEB'),
      fromName: 'AKAM Digital Editorial Desk',
    },
    {
      subject: '5/10: [White Theme] Your submission "The River at Twilight" is published in the AKAM Magazine!',
      html: buildStoryPublishedTemplate('EMAGAZINE'),
      fromName: 'AKAM Digital Editorial Desk',
    },
    {
      subject: '6/10: [White Theme] Registration Confirmed: Literary Conclave 2026 (Pass #AKAM-EVT-FREE-3419)',
      html: buildEventRegistrationTemplate(false),
      fromName: 'AKAM Digital Events',
    },
    {
      subject: '7/10: [White Theme] Ticket Confirmed: Literary Conclave 2026 (Pass #AKAM-EVT-PAID-8821)',
      html: buildEventRegistrationTemplate(true),
      fromName: 'AKAM Digital Events',
    },
    {
      subject: '8/10: [White Theme] Welcome to AKAM Digital: Your Student Scholar Pass is Approved! [AKAM-STU-2026-98124]',
      html: buildStudentStatusTemplate(true),
      fromName: 'AKAM Scholar Portal',
    },
    {
      subject: '9/10: [White Theme] Action Required: Update on Your Student Verification Application [AKAM-STU-2026-98124]',
      html: buildStudentStatusTemplate(false),
      fromName: 'AKAM Scholar Portal',
    },
    {
      subject: '10/10: [White Theme] [New Student Pass Application] Hashim (University of Calicut)',
      html: buildEditorialAlertTemplate(),
      fromName: 'AKAM Scholar Portal',
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    console.log(`Sending ${i + 1}/10: ${t.subject}...`);
    await sendEmail({
      to: TARGET_EMAIL,
      subject: t.subject,
      html: t.html,
      fromName: t.fromName,
    });
    // Brief sleep to avoid hitting rapid rate limits
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('Finished dispatching all 10 templates.');
}

main().catch((err) => {
  console.error('Fatal error in script:', err);
});
