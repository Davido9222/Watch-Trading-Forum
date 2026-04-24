const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadBuffer } = require('../config/cloudinary');

const router = express.Router();

// POST /api/uploads/image
// Returns: { url: "https://res.cloudinary.com/.../image/upload/.../watch-forum/..." }
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const { url } = await uploadBuffer(req.file, {
      folder: 'watch-forum/posts',
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    res.json({ url });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: err.message || 'Image upload failed' });
  }
});

module.exports = router;
