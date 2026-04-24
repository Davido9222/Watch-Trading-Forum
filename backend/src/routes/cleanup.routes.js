// ============================================
// One-time DB cleanup endpoint  (DELETE THIS FILE AFTER USE)
// ============================================
//
//   GET /api/cleanup/base64?secret=YOUR_CLEANUP_SECRET
//
// Strips every base64 (`data:`) image blob from:
//   - User.avatar          (replaced with a Dicebear avatar URL)
//   - Thread.images[]      (data: entries removed)
//   - Comment.images[]     (data: entries removed)
//
// Auth: requires the CLEANUP_SECRET env var on Render to match the
// `secret` query parameter (or the `x-cleanup-secret` header).
//
// Safe to call multiple times. Returns a JSON summary with before/after
// MongoDB storage stats so you can see exactly what changed.
//
// AFTER IT WORKS:
//   1. Delete this file from GitHub.
//   2. Remove the CLEANUP_SECRET env var on Render.
//   3. Remove the two lines from app.js that mount this router.
// ============================================

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
    return {
      dataSize: mb(stats.dataSize),
      storageSize: mb(stats.storageSize),
      indexSize: mb(stats.indexSize),
    };
  } catch (err) {
    return { error: err.message };
  }
}

router.get('/base64', async (req, res) => {
  try {
    const expected = process.env.CLEANUP_SECRET;
    const provided = req.query.secret || req.header('x-cleanup-secret');

    if (!expected) {
      return res.status(500).json({
        message:
          'CLEANUP_SECRET is not set on the server. Add it as an environment variable on Render and redeploy.',
      });
    }
    if (provided !== expected) {
      return res.status(403).json({ message: 'Forbidden — bad or missing secret.' });
    }

    const before = await dbStats();

    // 1) Avatars — replace any data: URL with a Dicebear URL keyed off username.
    const avatars = await User.collection.updateMany(
      { avatar: { $regex: /^data:/ } },
      [
        {
          $set: {
            avatar: {
              $concat: [
                'https://api.dicebear.com/7.x/avataaars/svg?seed=',
                { $ifNull: ['$username', 'user'] },
              ],
            },
          },
        },
      ]
    );

    // 2) Thread.images[] — pull out every data: entry.
    const threads = await Thread.collection.updateMany(
      { images: { $exists: true, $ne: [] } },
      { $pull: { images: { $regex: /^data:/ } } }
    );

    // 3) Comment.images[] — same treatment.
    const comments = await Comment.collection.updateMany(
      { images: { $exists: true, $ne: [] } },
      { $pull: { images: { $regex: /^data:/ } } }
    );

    // 4) Sanity check — anything left?
    const leftover = {
      users: await User.countDocuments({ avatar: { $regex: /^data:/ } }),
      threads: await Thread.countDocuments({
        images: { $elemMatch: { $regex: /^data:/ } },
      }),
      comments: await Comment.countDocuments({
        images: { $elemMatch: { $regex: /^data:/ } },
      }),
    };

    const after = await dbStats();

    res.json({
      ok: true,
      summary: {
        avatars: {
          matched: avatars.matchedCount,
          modified: avatars.modifiedCount,
        },
        threads: {
          matched: threads.matchedCount,
          modified: threads.modifiedCount,
        },
        comments: {
          matched: comments.matchedCount,
          modified: comments.modifiedCount,
        },
      },
      leftover,
      before,
      after,
      note:
        'Now: (1) delete this file from GitHub, (2) remove the CLEANUP_SECRET env var on Render, ' +
        '(3) remove the cleanup router lines from app.js.',
    });
  } catch (err) {
    console.error('cleanup failed', err);
    res.status(500).json({ message: err.message || 'Cleanup failed' });
  }
});

module.exports = router;
