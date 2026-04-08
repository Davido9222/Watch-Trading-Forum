const User = require('../models/User');
const { sanitizeUser } = require('./auth.controller');

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
  const allowed = ['motto', 'phone', 'avatar', 'email', 'username', 'socialMedia', 'profileSettings', 'country', 'language'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (updates.email && updates.email !== user.email) {
    const exists = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: user._id } });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    updates.email = updates.email.toLowerCase();
  }
  if (updates.username && updates.username !== user.username) {
    const exists = await User.findOne({ username: updates.username, _id: { $ne: user._id } });
    if (exists) return res.status(400).json({ message: 'Username already taken' });
  }
  Object.assign(user, updates);
  await user.save();
  res.json({ user: sanitizeUser(user) });
};

exports.uploadAvatar = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  // Convert the image to a base64 data URL — stores directly in MongoDB
  const base64 = req.file.buffer.toString('base64');
  const avatar = `data:${req.file.mimetype};base64,${base64}`;

  user.avatar = avatar;
  await user.save();
  res.json({ url: avatar, user: sanitizeUser(user) });
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
