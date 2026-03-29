const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
  avatar: { type: String, default: '' },
  motto: { type: String, default: '' },
  phone: { type: String, default: '' },
  donorGif: { type: String, default: '' },
  badges: { type: Array, default: [] },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  postCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  recoveryPhrase: { type: String, default: '' },
  knownIPs: { type: [String], default: [] },
  lastLoginAt: { type: Date, default: null },
  lastLoginIP: { type: String, default: '' },
  flappyHighScore: { type: Number, default: 0 },
  flappyTotalScore: { type: Number, default: 0 },
  flappyGamesPlayed: { type: Number, default: 0 },
  socialMedia: {
    youtube: { type: String, default: '' },
    x: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  profileSettings: {
    showPhone: { type: Boolean, default: false },
    showYouTube: { type: Boolean, default: true },
    showX: { type: Boolean, default: true },
    showInstagram: { type: Boolean, default: true }
  },
  country: { type: String, default: '' },
  language: { type: String, default: 'en' },
  karma: { type: Number, default: 0 },
  mutedThreads: { type: Array, default: [] },
  hallOfShame: { type: Object, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
