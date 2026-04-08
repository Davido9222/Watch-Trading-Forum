const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const router = express.Router();

router.post('/image', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

  // Convert the image buffer to a base64 data URL
  // This stores the image as a string — no file system needed, works on Render
  const base64 = req.file.buffer.toString('base64');
  const url = `data:${req.file.mimetype};base64,${base64}`;

  res.json({ url });
});

module.exports = router;
