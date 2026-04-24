const express = require('express');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const router = express.Router();

function mapNotification(n) {
  return {
    id: n._id.toString(),
    userId: n.userId.toString(),
    type: n.type,
    message: n.message,
    link: n.link || '',
    isRead: !!n.isRead,
    createdAt: n.createdAt,
    threadId: n.threadId || undefined,
    threadTitle: n.threadTitle || undefined,
    commentId: n.commentId || undefined,
    commentAuthorName: n.commentAuthorName || undefined,
  };
}

// List my notifications (newest first, last 100)
router.get('/', auth, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ notifications: list.map(mapNotification) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a single notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, notification: mapNotification(n) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all my notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.mapNotification = mapNotification;
