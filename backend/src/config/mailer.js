// ============================================
// MAILER CONFIG — Gmail SMTP via port 587 (STARTTLS)
// Port 465 (SSL) is blocked on Render/AWS. Port 587 works reliably.
//
// Required Render env vars:
//   SMTP_USER  — your Gmail address  (e.g. yourforum@gmail.com)
//   SMTP_PASS  — Gmail App Password  (16 chars, spaces OK)
//
// How to get a Gmail App Password:
//   myaccount.google.com → Security → 2-Step Verification → App passwords
// ============================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,       // false = STARTTLS (upgraded AFTER connect — NOT SSL on connect)
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,  // fail after 10 s instead of hanging forever
  greetingTimeout:   10000,
  socketTimeout:     15000,
});

async function sendMail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'Email service not configured. Add SMTP_USER and SMTP_PASS to your Render environment variables.'
    );
  }
  return transporter.sendMail({
    from: `"Watch Trading Forums" <${process.env.SMTP_USER}>`,
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
