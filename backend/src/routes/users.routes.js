const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { listUsers, getUserByUsername, updateMe, uploadAvatar, changePassword } = require('../controllers/users.controller');
const router = express.Router();

router.get('/', listUsers);
router.patch('/me/profile', auth, updateMe);
router.post('/me/avatar', auth, upload.single('image'), uploadAvatar);
router.post('/me/change-password', auth, changePassword);
router.get('/:username', getUserByUsername);

module.exports = router;
