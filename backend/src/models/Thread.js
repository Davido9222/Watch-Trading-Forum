const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  authorRole: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
  authorMotto: { type: String, default: '' },
  authorDonorGif: { type: String, default: '' },
  sectionId: { type: String, required: true },
  sectionName: { type: String, required: true },
  images: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  lastCommentAt: { type: Date, default: null },
  lastCommentBy: { type: String, default: '' }
}, { timestamps: true });


module.exports = mongoose.model('Thread', threadSchema);
