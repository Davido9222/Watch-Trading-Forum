const multer = require('multer');

// Keep memoryStorage so the buffer can be streamed straight to Cloudinary.
// Limit is 5 MB per file — Cloudinary will further compress server-side.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
