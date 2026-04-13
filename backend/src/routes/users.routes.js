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

router.get('/:username', getUserByUsername);

// ─── Logged-in user ───────────────────────────────────────────────────────────
router.patch('/me/profile', auth, updateMe);
router.post('/me/avatar', auth, upload.single('image'), uploadAvatar);
router.post('/me/change-password', auth, changePassword);

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

router.post('/:id/ban', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: req.body.reason || 'No reason given' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/ban', auth, requireRole('admin', 'owner'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, banReason: '' },
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
