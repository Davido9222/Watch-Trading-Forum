const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  listUsers,
  getUserByUsername,
  updateMe,
  uploadAvatar,
  changePassword,
} = require('../controllers/users.controller');
const User = require('../models/User');
const BanRecord = require('../models/BanRecord');
const { sanitizeUser } = require('../controllers/auth.controller');
const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/leaderboard/flappy', async (_req, res) => {
  try {
    const users = await User.find({ flappyHighScore: { $gt: 0 } })
      .sort({ flappyHighScore: -1 })
      .limit(50)
      .select('username avatar flappyHighScore flappyTotalScore flappyGamesPlayed');
    res.json({ leaderboard: users.map(u => ({
      userId: u._id.toString(),
      username: u.username,
      avatar: u.avatar || '',
      highScore: u.flappyHighScore,
      totalScore: u.flappyTotalScore,
      gamesPlayed: u.flappyGamesPlayed,
    }))});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC member directory — no auth required so non-logged-in users see members
router.get('/public', async (_req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('username avatar role motto donorGif badges isBanned postCount commentCount karma createdAt hallOfShame');
    res.json({ users: users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      avatar: u.avatar || '',
      role: u.role,
      motto: u.motto || '',
      donorGif: u.donorGif || '',
      badges: u.badges || [],
      isBanned: !!u.isBanned,
      postCount: u.postCount || 0,
      commentCount: u.commentCount || 0,
      karma: u.karma || 0,
      createdAt: u.createdAt,
      hallOfShame: u.hallOfShame || undefined,
    }))});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:username', getUserByUsername);

// ─── Logged-in user ───────────────────────────────────────────────────────────
router.patch('/me/profile', auth, updateMe);
router.post('/me/avatar', auth, upload.single('image'), uploadAvatar);
router.post('/me/change-password', auth, changePassword);

// Mute / unmute thread (notification opt-out) — persisted on the user document
router.post('/me/mute-thread/:threadId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const tid = req.params.threadId;
    const list = Array.isArray(user.mutedThreads) ? user.mutedThreads : [];
    if (!list.some(m => m && m.threadId === tid)) {
      list.push({ threadId: tid, mutedAt: new Date().toISOString() });
      user.mutedThreads = list;
      await user.save();
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/me/mute-thread/:threadId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.mutedThreads = (user.mutedThreads || []).filter(m => m && m.threadId !== req.params.threadId);
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update flappy stats — saves high score to MongoDB
router.post('/me/flappy-stats', auth, async (req, res) => {
  try {
    const { score } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ message: 'Invalid score' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.flappyGamesPlayed = (user.flappyGamesPlayed || 0) + 1;
    user.flappyTotalScore = (user.flappyTotalScore || 0) + score;
    if (score > (user.flappyHighScore || 0)) user.flappyHighScore = score;
    await user.save();
    res.json({ success: true, highScore: user.flappyHighScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin + Owner ────────────────────────────────────────────────────────────
router.get('/', auth, requireRole('admin', 'owner'), listUsers);

// Ban history records (for the "Ban History" tab) — admin / owner
router.get('/ban-records', auth, requireRole('admin', 'owner'), async (_req, res) => {
  try {
    const records = await BanRecord.find().sort({ bannedAt: -1 }).limit(500);
    res.json({ records: records.map(r => ({
      id: r._id.toString(),
      userId: r.userId?.toString?.() || '',
      username: r.username,
      bannedBy: r.bannedBy?.toString?.() || '',
      bannedByUsername: r.bannedByUsername,
      reason: r.reason || '',
      bannedAt: r.bannedAt ? r.bannedAt.toISOString() : new Date(0).toISOString(),
      unbannedAt: r.unbannedAt ? r.unbannedAt.toISOString() : undefined,
      unbannedBy: r.unbannedBy?.toString?.() || undefined,
      unbannedByUsername: r.unbannedByUsername || undefined,
      isActive: !!r.isActive,
    })) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/ban', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const admin = await User.findById(req.user.id);
    const reason = (req.body && req.body.reason) || 'No reason given';

    target.isBanned = true;
    target.banReason = reason;
    target.bannedBy = admin?._id || null;
    target.bannedByUsername = admin?.username || 'Unknown';
    target.bannedAt = new Date();
    await target.save();

    await BanRecord.create({
      userId: target._id,
      username: target.username,
      bannedBy: admin?._id,
      bannedByUsername: admin?.username || 'Unknown',
      reason,
      bannedAt: target.bannedAt,
      isActive: true,
    });

    res.json({ success: true, user: sanitizeUser(target) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/ban', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const admin = await User.findById(req.user.id);

    target.isBanned = false;
    target.banReason = '';
    await target.save();

    // Mark the latest active ban record as lifted
    await BanRecord.updateMany(
      { userId: target._id, isActive: true },
      {
        $set: {
          isActive: false,
          unbannedAt: new Date(),
          unbannedBy: admin?._id,
          unbannedByUsername: admin?.username || 'Unknown',
        }
      }
    );

    res.json({ success: true, user: sanitizeUser(target) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin / owner edit ANY user's profile (motto, avatar, social, etc.)
router.patch('/:id', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // Only owner can edit other admins / owners
    if ((target.role === 'admin' || target.role === 'owner') && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can edit administrators' });
    }

    const allowed = ['motto', 'phone', 'avatar', 'donorGif', 'socialMedia', 'profileSettings', 'country', 'language', 'badges'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) target[key] = req.body[key];
    }
    await target.save();
    res.json({ success: true, user: sanitizeUser(target) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Award a badge to a user (admin/owner)
router.post('/:id/badges', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const { type } = req.body;
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ message: 'Badge type required' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const badge = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      awardedAt: new Date().toISOString(),
      awardedBy: req.user.id,
    };
    user.badges = Array.isArray(user.badges) ? [...user.badges, badge] : [badge];
    await user.save();
    res.json({ success: true, badge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove a badge from a user (admin/owner)
router.delete('/:id/badges/:badgeId', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.badges = (user.badges || []).filter(b => b && b.id !== req.params.badgeId);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/donor-gif', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const { url } = req.body;
    if (typeof url !== 'string') return res.status(400).json({ message: 'url required' });
    const user = await User.findByIdAndUpdate(req.params.id, { donorGif: url }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/donor-gif', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { donorGif: '' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/hall-of-shame', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const { reason, duration } = req.body;
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ message: 'Reason required' });
    }
    const ms = duration === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ms).toISOString();
    const record = {
      userId: req.params.id,
      reason,
      duration: duration === '7d' ? '7d' : '24h',
      appliedAt: new Date().toISOString(),
      appliedBy: req.user.id,
      expiresAt,
    };
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { hallOfShame: record },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/hall-of-shame', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { hallOfShame: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Owner only ───────────────────────────────────────────────────────────────
router.patch('/:id/role', auth, requireRole('owner'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
