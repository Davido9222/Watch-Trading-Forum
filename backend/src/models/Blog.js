const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title:            { type: String, required: true },
    slug:             { type: String, required: true, unique: true, index: true },
    excerpt:          { type: String, required: true },
    content:          { type: String, required: true },
    authorId:         { type: String, required: true },
    authorName:       { type: String, required: true },
    authorAvatar:     { type: String, default: '' },
    featuredImage:    { type: String, default: '' },
    tags:             { type: [String], default: [] },
    viewCount:        { type: Number, default: 0 },
    metaTitle:        { type: String, default: '' },
    metaDescription:  { type: String, default: '' },
    translations:     { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'publishedAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Blog', blogSchema);
