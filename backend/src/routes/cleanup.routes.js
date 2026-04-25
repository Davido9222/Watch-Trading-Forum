const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Comment = require('../models/Comment');

const router = express.Router();

async function dbStats() {
  try {
    const stats = await mongoose.connection.db.stats();
    const mb = (n) => `${(n / (1024 * 1024)).toFixed(2)} MB`;
    return { dataSize: mb(stats.dataSize), storageSize: mb(stats.storageSize), indexSize: mb(stats.indexSize) };
  } catch (err) { return { error: err.message }; }
}

router.get('/base64', async (req, res) => {
  try {
    const expected = process.env.CLEANUP_SECRET;
    const provided = req.query.secret || req.header('x-cleanup-secret');
    if (!expected) return res.status(500).json({ message: 'CLEANUP_SECRET not set' });
    if (provided !== expected) return res.status(403).json({ message: 'Forbidden' });

    const before = await dbStats();

    const userAvatars = await User.collection.updateMany(
      { avatar: { $regex: /^data:/ } },
      [{ $set: { avatar: { $concat: ['https://api.dicebear.com/7.x/avataaars/svg?seed=', { $ifNull: ['$username', 'user'] }] } } }]
    );
    const userDonorGifs = await User.collection.updateMany(
      { donorGif: { $regex: /^data:/ } },
      { $set: { donorGif: '' } }
    );
    const threadImages = await Thread.collection.updateMany(
      { images: { $exists: true, $ne: [] } },
      { $pull: { images: { $regex: /^data:/ } } }
    );
    const threadAuthorAvatars = await Thread.collection.updateMany(
      { authorAvatar: { $regex: /^data:/ } },
      { $set: { authorAvatar: '' } }
    );
    const threadAuthorDonorGifs = await Thread.collection.updateMany(
      { authorDonorGif: { $regex: /^data:/ } },
      { $set: { authorDonorGif: '' } }
    );
    const commentImages = await Comment.collection.updateMany(
      { images: { $exists: true, $ne: [] } },
      { $pull: { images: { $regex: /^data:/ } } }
    );
    const commentAuthorAvatars = await Comment.collection.updateMany(
      { authorAvatar: { $regex: /^data:/ } },
      { $set: { authorAvatar: '' } }
    );
    const commentAuthorDonorGifs = await Comment.collection.updateMany(
      { authorDonorGif: { $regex: /^data:/ } },
      { $set: { authorDonorGif: '' } }
    );

    const after = await dbStats();
    res.json({
      ok: true,
      modified: {
        userAvatars: userAvatars.modifiedCount,
        userDonorGifs: userDonorGifs.modifiedCount,
        threadImages: threadImages.modifiedCount,
        threadAuthorAvatars: threadAuthorAvatars.modifiedCount,
        threadAuthorDonorGifs: threadAuthorDonorGifs.modifiedCount,
        commentImages: commentImages.modifiedCount,
        commentAuthorAvatars: commentAuthorAvatars.modifiedCount,
        commentAuthorDonorGifs: commentAuthorDonorGifs.modifiedCount,
      },
      before, after,
      note: 'Done. Now delete this file, remove the 2 lines from app.js, remove CLEANUP_SECRET env var.',
    });
  } catch (err) {
    console.error('cleanup failed', err);
    res.status(500).json({ message: err.message || 'Cleanup failed' });
  }
});

module.exports = router;
