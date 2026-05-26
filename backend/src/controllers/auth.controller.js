// ============================================
// AUTH CONTROLLER
// sanitizeUser exposes all fields needed by the frontend.
// New exports: sendRegisterOtp, forgotPassword, resetPassword
// ============================================

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { sendMail, otpEmailHtml } = require('../config/mailer');

// ── In-memory OTP store for registration (email → { otp, expires, username }) ──
const registerOtpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  return {
    id: obj._id?.toString?.() || obj.id,
    username: obj.username,
    email: obj.email,
    phone: obj.phone || '',
    role: obj.role,
    avatar: obj.avatar || '',
    motto: obj.motto || '',
    donorGif: obj.donorGif || '',
    badges: obj.badges || [],
    isBanned: !!obj.isBanned,
    banReason: obj.banReason || undefined,
    bannedBy: obj.bannedBy ? obj.bannedBy.toString() : undefined,
    bannedByUsername: obj.bannedByUsername || undefined,
    bannedAt: obj.bannedAt || undefined,
    postCount: obj.postCount || 0,
    commentCount: obj.commentCount || 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    knownIPs: obj.knownIPs || [],
    flappyHighScore: obj.flappyHighScore || 0,
    flappyTotalScore: obj.flappyTotalScore || 0,
    flappyGamesPlayed: obj.flappyGamesPlayed || 0,
    karma: obj.karma || 0,
    mutedThreads: obj.mutedThreads || [],
    socialMedia: obj.socialMedia || {},
    profileSettings: obj.profileSettings || {},
    country: obj.country || '',
    language: obj.language || 'en',
    twoFactorEnabled: !!obj.twoFactorEnabled,
    recoveryPhrase: obj.recoveryPhrase || undefined,
    hallOfShame: obj.hallOfShame || undefined,
    lastLoginAt: obj.lastLoginAt || undefined,
    lastLoginIP: obj.lastLoginIP || undefined,
    lastThreadAt: obj.lastThreadAt || undefined,
    lastCommentAt: obj.lastCommentAt || undefined,
  };
}

// ── SEND REGISTRATION OTP ──────────────────────────────────────────────────────
// POST /api/auth/send-register-otp
// Body: { email, username }
// Validates email/username not taken, sends 6-digit OTP to email.
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email || !username) return res.status(400).json({ message: 'Email and username are required' });

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const otp = generateOtp();
    const expires = Date.now() + 30 * 60 * 1000; // 30 minutes
    registerOtpStore.set(email.toLowerCase(), { otp, expires, username });

    await sendMail(
      email,
      'Your Watch Trading Forums Verification Code',
      otpEmailHtml(otp, 'register')
    );

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('sendRegisterOtp error:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification code' });
  }
};

// ── REGISTER (with OTP verification) ──────────────────────────────────────────
// POST /api/auth/register
// Body: { username, email, password, country, language, otp }
exports.register = async (req, res) => {
  try {
    const { username, email, password, country, language, otp } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing required fields' });

    // Verify OTP
    if (!otp) return res.status(400).json({ message: 'Verification code is required' });
    const stored = registerOtpStore.get(email.toLowerCase());
    if (!stored) return res.status(400).json({ message: 'No verification code found for this email. Please request a new code.' });
    if (Date.now() > stored.expires) {
      registerOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }
    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    registerOtpStore.delete(email.toLowerCase());

    // Check availability again (race condition guard)
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
      country,
      language,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    });
    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── LOGIN ──────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ message: user.banReason || 'Account is banned' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.twoFactorEnabled) {
      return res.json({ requires2FA: true, pendingUserId: user._id.toString() });
    }
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;
    if (req.ip && !user.knownIPs.includes(req.ip)) user.knownIPs.push(req.ip);
    await user.save();
    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ME ─────────────────────────────────────────────────────────────────────────
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitizeUser(user) });
};

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { email }
// Generates a 6-digit OTP, saves it to the user document, sends email.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If an account with that email exists, a reset code has been sent.' });

    const otp = generateOtp();
    user.passwordResetCode = otp;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    await sendMail(
      user.email,
      'Your Watch Trading Forums Password Reset Code',
      otpEmailHtml(otp, 'reset')
    );

    res.json({ message: 'If an account with that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: error.message || 'Failed to send reset code' });
  }
};

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Body: { email, code, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'Email, code, and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordResetCode) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }
    if (user.passwordResetExpires < new Date()) {
      user.passwordResetCode = null;
      user.passwordResetExpires = null;
      await user.save();
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }
    if (user.passwordResetCode !== code.toString().trim()) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetCode = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
};

exports.sanitizeUser = sanitizeUser;
