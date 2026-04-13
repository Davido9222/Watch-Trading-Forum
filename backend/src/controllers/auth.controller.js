const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/token');

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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ message: user.banReason || 'Account is banned' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    // Pause login if 2FA is enabled — frontend will ask for the 6-digit code
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

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitizeUser(user) });
};

exports.sanitizeUser = sanitizeUser;
