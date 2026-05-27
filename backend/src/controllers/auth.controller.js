const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');
const { signToken } = require('../utils/token');
const { sendEmail, otpEmailHtml } = require('../utils/email');

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
  };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Existing: Register (direct, no email verify) ─────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password, country, language } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
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

// ─── New: Send email verification OTP ─────────────────────────────────────────
exports.sendVerifyEmail = async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) return res.status(400).json({ message: 'Username already taken' });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await OtpCode.deleteMany({ email: email.toLowerCase(), type: 'verify_email' });
    await OtpCode.create({ email: email.toLowerCase(), code, type: 'verify_email', expiresAt });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your Watch Trading Forums email',
      html: otpEmailHtml({ code, type: 'verify_email', username }),
    });

    if (!emailResult.success && process.env.RESEND_API_KEY) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    const devCode = !process.env.RESEND_API_KEY ? code : undefined;
    res.json({ success: true, message: 'Verification code sent to your email', ...(devCode && { devCode }) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── New: Verify email OTP and create account ─────────────────────────────────
exports.verifyRegister = async (req, res) => {
  try {
    const { email, code, username, password, country, language } = req.body;
    if (!email || !code || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const otpRecord = await OtpCode.findOne({
      email: email.toLowerCase(),
      type: 'verify_email',
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired verification code' });

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      country,
      language,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    });

    await OtpCode.deleteMany({ email: email.toLowerCase(), type: 'verify_email' });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── New: Send password reset OTP ─────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset code has been sent' });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await OtpCode.deleteMany({ email: email.toLowerCase(), type: 'reset_password' });
    await OtpCode.create({ email: email.toLowerCase(), code, type: 'reset_password', expiresAt });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset your Watch Trading Forums password',
      html: otpEmailHtml({ code, type: 'reset_password', username: user.username }),
    });

    const devCode = !process.env.RESEND_API_KEY ? code : undefined;
    res.json({
      success: true,
      message: 'If that email exists, a reset code has been sent to it',
      ...(devCode && { devCode }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── New: Verify reset OTP and set new password ───────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const otpRecord = await OtpCode.findOne({
      email: email.toLowerCase(),
      type: 'reset_password',
      code,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired reset code' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await OtpCode.deleteMany({ email: email.toLowerCase(), type: 'reset_password' });

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── New: Reset password by recovery phrase ───────────────────────────────────
exports.resetByPhrase = async (req, res) => {
  try {
    const { username, recoveryPhrase, newPassword } = req.body;
    if (!username || !recoveryPhrase || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.recoveryPhrase) {
      return res.status(400).json({ message: 'This account does not have a recovery phrase set up' });
    }
    if (user.recoveryPhrase.trim().toLowerCase() !== recoveryPhrase.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Invalid recovery phrase' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Existing: Login ──────────────────────────────────────────────────────────
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

// ─── Existing: Me ─────────────────────────────────────────────────────────────
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitizeUser(user) });
};

exports.sanitizeUser = sanitizeUser;
