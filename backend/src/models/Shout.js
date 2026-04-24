const mongoose = require('mongoose');

const shoutSchema = new mongoose.Schema({
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  authorRole: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
}, { timestamps: true });

shoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Shout', shoutSchema);
