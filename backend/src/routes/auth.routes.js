const express = require('express');
const {
  sendRegisterOtp,
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/send-register-otp', sendRegisterOtp);
router.post('/register',         register);
router.post('/login',            login);
router.get('/me',           auth, me);
router.post('/forgot-password',  forgotPassword);
router.post('/reset-password',   resetPassword);

module.exports = router;
