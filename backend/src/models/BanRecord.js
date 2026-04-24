const mongoose = require('mongoose');

const banRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bannedByUsername: { type: String, required: true },
  reason: { type: String, default: '' },
  bannedAt: { type: Date, default: Date.now },
  unbannedAt: { type: Date, default: null },
  unbannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unbannedByUsername: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('BanRecord', banRecordSchema);
