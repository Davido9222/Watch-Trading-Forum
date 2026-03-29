const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const router = express.Router();

router.post('/image', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
