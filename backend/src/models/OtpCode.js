const mongoose = require('mongoose');

const otpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['verify_email', 'reset_password'], required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

otpCodeSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OtpCode', otpCodeSchema);
