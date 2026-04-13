const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { generateSecret, verifyTOTP, getQRCodeURL } = require('../utils/totp');
const { signToken } = require('../utils/token');
const { sanitizeUser } = require('../controllers/auth.controller');
const router = express.Router();

// Get QR code URL to scan with Google Authenticator
router.post('/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save();
    res.json({ qrCodeURL: getQRCodeURL(secret, user.email), secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Confirm the scanned code — activates 2FA
router.post('/enable', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.twoFactorSecret) return res.status(400).json({ message: 'Run /setup first' });
    if (!verifyTOTP(user.twoFactorSecret, req.body.token)) {
      return res.status(400).json({ message: 'Invalid code. Try again.' });
    }
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Turn off 2FA
router.post('/disable', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: '',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Used during login when 2FA is active
router.post('/login-verify', async (req, res) => {
  try {
    const { pendingUserId, token } = req.body;
    const user = await User.findById(pendingUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!verifyTOTP(user.twoFactorSecret, token)) {
      return res.status(400).json({ message: 'Invalid code' });
    }
    res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
