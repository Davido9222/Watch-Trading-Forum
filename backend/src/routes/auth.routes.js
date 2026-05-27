const express = require('express');
const {
  register,
  login,
  me,
  sendVerifyEmail,
  verifyRegister,
  forgotPassword,
  resetPassword,
  resetByPhrase,
} = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);

router.post('/send-verify-email', sendVerifyEmail);
router.post('/verify-register', verifyRegister);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-by-phrase', resetByPhrase);

module.exports = router;
