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

// Compound index that matches the listThreads sort order.
// Without this, Mongo loads every thread into RAM to sort and trips the
// 32 MB in-memory sort limit ("QueryExceededMemoryLimitNoDiskUseAllowed").
// With it, the sort is served straight from the index — O(log n), no RAM blowup.
threadSchema.index({ isPinned: -1, createdAt: -1 });

// Useful for the per-section views and "newest in section" queries.
threadSchema.index({ sectionId: 1, createdAt: -1 });

module.exports = mongoose.model('Thread', threadSchema);
