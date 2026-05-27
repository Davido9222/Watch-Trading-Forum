// ============================================
// MAILER CONFIG — Brevo (formerly Sendinblue) SMTP
//
// WHY BREVO? Gmail SMTP is blocked by Render/AWS cloud IP ranges.
// Brevo's relay works from any cloud platform, free, no domain verification needed.
//
// Setup (5 min):
//   1. Sign up free at brevo.com
//   2. Settings → SMTP & API → SMTP tab → copy SMTP Key
//   3. Add these to Render Environment:
//        BREVO_SMTP_USER = your Brevo account email
//        BREVO_SMTP_KEY  = the SMTP key (NOT your login password)
//
// Free tier: 300 emails/day — plenty for a forum.
// ============================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
  connectionTimeout: 10000,
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

async function sendMail(to, subject, html) {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    throw new Error(
      'Email not configured. Sign up free at brevo.com, then add BREVO_SMTP_USER and BREVO_SMTP_KEY to your Render env vars.'
    );
  }
  return transporter.sendMail({
    from: `"Watch Trading Forums" <${process.env.BREVO_SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

function otpEmailHtml(otp, purpose) {
  const title = purpose === 'register' ? 'Verify Your Email' : 'Reset Your Password';
  const body  = purpose === 'register'
    ? 'Thank you for joining Watch Trading Forums! Use the code below to verify your email and complete registration.'
    : 'You requested a password reset for your Watch Trading Forums account. Use the code below to set a new password.';
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#1e293b;padding:28px 32px;text-align:center;">
          <span style="font-size:32px;">&#8987;</span>
          <h1 style="color:#fff;margin:8px 0 0;font-size:20px;font-weight:700;">Watch Trading Forums</h1>
        </div>
        <div style="padding:36px 32px;">
          <h2 style="color:#1e293b;font-size:22px;margin:0 0 12px;">${title}</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">${body}</p>
          <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Your verification code</p>
            <span style="font-size:42px;font-weight:800;color:#1e293b;letter-spacing:8px;">${otp}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;text-align:center;">
            This code expires in <strong>30 minutes</strong>.<br>
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
          <p style="color:#cbd5e1;font-size:12px;margin:0;">&copy; Watch Trading Forums</p>
        </div>
      </div>
    </body></html>
  `;
}

module.exports = { sendMail, otpEmailHtml };
