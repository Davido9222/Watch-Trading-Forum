const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Shout = require('../models/Shout');
const User = require('../models/User');
const router = express.Router();

const MAX_SHOUTS = 100;
const RATE_WINDOW_MS = 15 * 1000;
const MAX_PER_WINDOW = 10;

// In-memory rate-limit window per user (per server process)
const userWindow = new Map(); // userId -> { windowStart, count }

function mapShout(s) {
  return {
    id: s._id.toString(),
    content: s.content,
    authorId: s.authorId.toString(),
    authorName: s.authorName,
    authorAvatar: s.authorAvatar || '',
    authorRole: s.authorRole || 'user',
    timestamp: s.createdAt,
  };
}

// Public: anyone can read the live shoutbox
router.get('/', async (_req, res) => {
  try {
    const shouts = await Shout.find().sort({ createdAt: -1 }).limit(MAX_SHOUTS);
    res.json({ messages: shouts.reverse().map(mapShout) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logged-in users post a message
router.post('/', auth, async (req, res) => {
  try {
    const content = (req.body && req.body.content || '').toString().trim();
    if (!content) return res.status(400).json({ message: 'Message cannot be empty' });
    if (content.length > 500) return res.status(400).json({ message: 'Message too long (max 500)' });

    // Rate-limit: 10 per 15s
    const now = Date.now();
    const w = userWindow.get(req.user.id) || { windowStart: 0, count: 0 };
    if (now - w.windowStart > RATE_WINDOW_MS) {
      w.windowStart = now;
      w.count = 0;
    }
    if (w.count >= MAX_PER_WINDOW) {
      const wait = Math.ceil((RATE_WINDOW_MS - (now - w.windowStart)) / 1000);
      return res.status(429).json({ message: `Rate limit exceeded. Wait ${wait}s.` });
    }
    w.count += 1;
    userWindow.set(req.user.id, w);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'You are banned' });

    const shout = await Shout.create({
      content,
      authorId: user._id,
      authorName: user.username,
      authorAvatar: user.avatar || '',
      authorRole: user.role,
    });

    // Trim to MAX_SHOUTS
    const total = await Shout.countDocuments();
    if (total > MAX_SHOUTS) {
      const excess = total - MAX_SHOUTS;
      const oldest = await Shout.find().sort({ createdAt: 1 }).limit(excess).select('_id');
      await Shout.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }

    res.status(201).json({ shout: mapShout(shout) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Owner can clear the shoutbox
router.delete('/', auth, requireRole('owner'), async (_req, res) => {
  try {
    await Shout.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
