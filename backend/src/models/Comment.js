const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  authorRole: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },
  authorMotto: { type: String, default: '' },
  authorDonorGif: { type: String, default: '' },
  authorBadges: { type: Array, default: [] },
  authorHallOfShame: { type: Object, default: null },
  images: { type: [String], default: [] },
  votes: { type: Array, default: [] },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
