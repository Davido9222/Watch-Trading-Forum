const Message = require('../models/Message');
const User = require('../models/User');

function mapMessage(msg) {
  const obj = msg.toObject ? msg.toObject() : msg;
  return {
    id: obj._id?.toString?.() || obj.id,
    senderId: obj.senderId?.toString?.() || obj.senderId,
    senderName: obj.senderName,
    senderAvatar: obj.senderAvatar || undefined,
    recipientId: obj.recipientId?.toString?.() || obj.recipientId,
    recipientName: obj.recipientName,
    subject: obj.subject,
    content: obj.content,
    isRead: !!obj.isRead,
    createdAt: obj.createdAt,
  };
}

exports.listForMe = async (req, res) => {
  const messages = await Message.find({
    $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
  }).sort({ createdAt: 1 });
  res.json({ messages: messages.map(mapMessage) });
};

exports.send = async (req, res) => {
  const sender = await User.findById(req.user.id);
  const recipient = await User.findById(req.body.recipientId);
  if (!sender || !recipient) return res.status(404).json({ message: 'Sender or recipient not found' });
  const message = await Message.create({
    senderId: sender._id,
    senderName: sender.username,
    senderAvatar: sender.avatar,
    recipientId: recipient._id,
    recipientName: recipient.username,
    subject: req.body.subject || 'No subject',
    content: req.body.content,
  });
  res.status(201).json({ message: mapMessage(message) });
};

exports.markRead = async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!message) return res.status(404).json({ message: 'Message not found' });
  res.json({ message: mapMessage(message) });
};

exports.markConversationRead = async (req, res) => {
  await Message.updateMany({ recipientId: req.user.id, senderId: req.params.senderId }, { isRead: true });
  res.json({ success: true });
};
