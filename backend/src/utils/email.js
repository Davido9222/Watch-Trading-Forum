// ============================================
// EMAIL UTILITY - Uses Resend HTTP API
// Render blocks SMTP ports 25/465/587.
// Resend uses HTTPS (port 443) — works on Render.
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Watch Trading Forums <noreply@watchtradingforums.com>';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email not sent to', to);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[email] Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[email] fetch error:', err.message);
    return { success: false, error: err.message };
  }
}

function otpEmailHtml({ code, type, username }) {
  const action = type === 'verify_email' ? 'verify your email address' : 'reset your password';
  const heading = type === 'verify_email' ? 'Verify Your Email' : 'Reset Your Password';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .logo { font-size: 20px; font-weight: bold; color: #1e3a5f; margin-bottom: 24px; }
        h1 { font-size: 24px; color: #111; margin: 0 0 16px; }
        p { color: #444; line-height: 1.6; margin: 0 0 16px; }
        .code-box { background: #f0f4ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
        .code { font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1d4ed8; font-family: monospace; }
        .expiry { font-size: 13px; color: #888; }
        .footer { margin-top: 32px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">⌚ Watch Trading Forums</div>
        <h1>${heading}</h1>
        <p>Hi${username ? ' ' + username : ''},</p>
        <p>Use the verification code below to ${action}. This code expires in <strong>30 minutes</strong>.</p>
        <div class="code-box">
          <div class="code">${code}</div>
          <p class="expiry">Expires in 30 minutes</p>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
          Watch Trading Forums · The premier community for watch traders and collectors worldwide
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = { sendEmail, otpEmailHtml };
