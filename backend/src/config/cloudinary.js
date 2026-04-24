// ============================================
// Cloudinary configuration + small upload helper
// ============================================
//
// All uploaded images go through Cloudinary so that MongoDB only
// ever stores a short URL string, never the binary data.
// ============================================

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an in-memory file (from multer.memoryStorage) to Cloudinary.
 *
 * @param {{ buffer: Buffer, mimetype: string }} file
 * @param {{ folder?: string, transformation?: object[] }} [opts]
 * @returns {Promise<{ url: string, publicId: string }>}
 */
function uploadBuffer(file, opts = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer provided'));
    }
    if (!isConfigured()) {
      return reject(
        new Error(
          'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, ' +
            'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in your environment.'
        )
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder || 'watch-forum',
        resource_type: 'image',
        transformation: opts.transformation,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(file.buffer);
  });
}

module.exports = { cloudinary, uploadBuffer, isConfigured };
