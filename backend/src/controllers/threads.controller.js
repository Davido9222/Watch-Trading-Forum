const Thread = require('../models/Thread');
const Comment = require('../models/Comment');
const User = require('../models/User');

function mapThread(thread) {
  const obj = thread.toObject ? thread.toObject() : thread;
  return {
    id: obj._id?.toString?.() || obj.id,
    title: obj.title,
    content: obj.content,
    authorId: obj.authorId?.toString?.() || obj.authorId,
    authorName: obj.authorName,
    authorAvatar: obj.authorAvatar,
    authorRole: obj.authorRole,
    authorMotto: obj.authorMotto,
    authorDonorGif: obj.authorDonorGif,
    sectionId: obj.sectionId,
    sectionName: obj.sectionName,
    images: obj.images || [],
    isPinned: !!obj.isPinned,
    isLocked: !!obj.isLocked,
    viewCount: obj.viewCount || 0,
    commentCount: obj.commentCount || 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    lastCommentAt: obj.lastCommentAt || undefined,
    lastCommentBy: obj.lastCommentBy || undefined,
  };
}

function mapComment(comment) {
  const obj = comment.toObject ? comment.toObject() : comment;
  return {
    id: obj._id?.toString?.() || obj.id,
    threadId: obj.threadId?.toString?.() || obj.threadId,
    content: obj.content,
    authorId: obj.authorId?.toString?.() || obj.authorId,
    authorName: obj.authorName,
    authorAvatar: obj.authorAvatar,
    authorRole: obj.authorRole,
    authorMotto: obj.authorMotto,
    authorDonorGif: obj.authorDonorGif,
    authorBadges: obj.authorBadges || [],
    authorHallOfShame: obj.authorHallOfShame || undefined,
    images: obj.images || [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    votes: obj.votes || [],
    upvotes: obj.upvotes || 0,
    downvotes: obj.downvotes || 0,
  };
}

exports.listThreads = async (_req, res) => {
  const threads = await Thread.find().sort({ isPinned: -1, createdAt: -1 });
  res.json({ threads: threads.map(mapThread) });
};

exports.getThread = async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  const comments = await Comment.find({ threadId: thread._id }).sort({ createdAt: 1 });
  res.json({ thread: mapThread(thread), comments: comments.map(mapComment) });
};

exports.createThread = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { title, content, sectionId, sectionName, images = [] } = req.body;
  if (!title || !sectionId || !sectionName) return res.status(400).json({ message: 'Missing required fields' });
  const thread = await Thread.create({
    title,
    content: content || '',
    authorId: user._id,
    authorName: user.username,
    authorAvatar: user.avatar,
    authorRole: user.role,
    authorMotto: user.motto,
    authorDonorGif: user.donorGif || '',
    sectionId,
    sectionName,
    images,
  });
  user.postCount += 1;
  await user.save();
  res.status(201).json({ thread: mapThread(thread) });
};

exports.incrementViewCount = async (req, res) => {
  const thread = await Thread.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true });
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  res.json({ thread: mapThread(thread) });
};

exports.updateThreadFlags = async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  if (req.body.isPinned !== undefined) thread.isPinned = !!req.body.isPinned;
  if (req.body.isLocked !== undefined) thread.isLocked = !!req.body.isLocked;
  await thread.save();
  res.json({ thread: mapThread(thread) });
};

exports.deleteThread = async (req, res) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  await Comment.deleteMany({ threadId: thread._id });
  await thread.deleteOne();
  res.json({ success: true });
};

exports.createComment = async (req, res) => {
  const user = await User.findById(req.user.id);
  const thread = await Thread.findById(req.params.id);
  if (!user || !thread) return res.status(404).json({ message: 'Thread or user not found' });
  const { content, images = [] } = req.body;
  if (!content && images.length === 0) return res.status(400).json({ message: 'Comment cannot be empty' });
  const comment = await Comment.create({
    threadId: thread._id,
    content: content || '',
    authorId: user._id,
    authorName: user.username,
    authorAvatar: user.avatar,
    authorRole: user.role,
    authorMotto: user.motto,
    authorDonorGif: user.donorGif || '',
    authorBadges: user.badges || [],
    authorHallOfShame: user.hallOfShame || undefined,
    images,
  });
  thread.commentCount += 1;
  thread.lastCommentAt = new Date();
  thread.lastCommentBy = user.username;
  await thread.save();
  user.commentCount += 1;
  await user.save();
  res.status(201).json({ comment: mapComment(comment) });
};

exports.mapThread = mapThread;
exports.mapComment = mapComment;
