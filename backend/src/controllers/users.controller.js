const User = require('../models/User');
const { sanitizeUser } = require('./auth.controller');
const { uploadBuffer } = require('../config/cloudinary');

exports.listUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(sanitizeUser) });
};

exports.getUserByUsername = async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitizeUser(user) });
};

exports.updateMe = async (req, res) => {
  const allowed = [
    'motto',
    'phone',
    'avatar',
    'email',
    'username',
    'socialMedia',
    'profileSettings',
    'country',
    'language',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Defensive: never let a base64 data: URL be written into the avatar field.
  // Avatars must be hosted URLs (Cloudinary, Dicebear, etc.) — anything else
  // would balloon the document and refill the database.
  if (typeof updates.avatar === 'string' && updates.avatar.startsWith('data:')) {
    return res.status(400).json({
      message:
        'Avatar must be a hosted image URL. Use the avatar upload endpoint instead.',
    });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (updates.email && updates.email !== user.email) {
    const exists = await User.findOne({
      email: updates.email.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    updates.email = updates.email.toLowerCase();
  }
  if (updates.username && updates.username !== user.username) {
    const exists = await User.findOne({
      username: updates.username,
      _id: { $ne: user._id },
    });
    if (exists) return res.status(400).json({ message: 'Username already taken' });
  }
  Object.assign(user, updates);
  await user.save();
  res.json({ user: sanitizeUser(user) });
};

exports.uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const { url } = await uploadBuffer(req.file, {
      folder: 'watch-forum/avatars',
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    user.avatar = url;
    await user.save();
    res.json({ url, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Avatar upload failed:', err);
    res.status(500).json({ message: err.message || 'Avatar upload failed' });
  }
};

exports.changePassword = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Incorrect current password' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ success: true });
};
