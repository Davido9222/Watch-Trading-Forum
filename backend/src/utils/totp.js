const crypto = require('crypto');

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let result = '', bits = 0, value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(str) {
  const s = str.toUpperCase().replace(/=+$/, '');
  let bits = 0, value = 0;
  const result = [];
  for (const char of s) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(result);
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function verifyTOTP(secret, token) {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -1; i <= 1; i++) {
    if (hotp(secret, counter + i) === String(token).trim()) return true;
  }
  return false;
}

// Returns a Google Charts QR code URL — no package needed, just an image URL
function getQRCodeURL(secret, email) {
  const label = encodeURIComponent(`Watch Trading Forum:${email}`);
  const issuer = encodeURIComponent('Watch Trading Forum');
  const otpauth = encodeURIComponent(
    `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`
  );
  return `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${otpauth}`;
}

module.exports = { generateSecret, verifyTOTP, getQRCodeURL };
