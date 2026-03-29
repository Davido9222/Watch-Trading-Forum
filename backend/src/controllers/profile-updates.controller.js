const ProfileUpdate = require('../models/ProfileUpdate');

function mapUpdate(update) {
  const obj = update.toObject ? update.toObject() : update;
  return {
    id: obj._id?.toString?.() || obj.id,
    userId: obj.userId?.toString?.() || obj.userId,
    content: obj.content,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

exports.listByUser = async (req, res) => {
  const updates = await ProfileUpdate.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json({ updates: updates.map(mapUpdate) });
};

exports.create = async (req, res) => {
  const update = await ProfileUpdate.create({ userId: req.user.id, content: req.body.content });
  res.status(201).json({ update: mapUpdate(update) });
};

exports.remove = async (req, res) => {
  const update = await ProfileUpdate.findById(req.params.id);
  if (!update) return res.status(404).json({ message: 'Update not found' });
  if (update.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await update.deleteOne();
  res.json({ success: true });
};
