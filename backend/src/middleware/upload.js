const multer = require('multer');

// Store file in memory (no disk) — works on Render perfectly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
    if (!allowed.has(file.mimetype)) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  }
});

module.exports = { upload };
