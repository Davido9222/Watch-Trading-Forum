const Thread = require('../models/Thread');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const RATE_LIMIT_MS = 60 * 1000; // 1 thread + 1 comment per minute per user

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

// ---------------------------------------------------------------------------
// listThreads
// ---------------------------------------------------------------------------
// Two important changes vs. the original:
//   1. .allowDiskUse(true) lets MongoDB spill the sort to disk if it ever
//      exceeds the 32 MB in-memory sort limit again. This is a belt-and-
//      braces fix on top of the new compound index.
//   2. Excluded the heavy `images` field from the list response. The forum
//      list view doesn't render the inline images anyway — they're only
//      needed on the thread detail page, which is fetched by getThread.
//      This keeps each thread document small in the wire response and in
//      the in-memory result set.
// The frontend keeps working: mapThread always returns images: [] when
// the field is absent, so any UI code that reads thread.images sees an
// empty array on the list page (just as if the thread had no images).
// ---------------------------------------------------------------------------
exports.listThreads = async (_req, res) => {
  const threads = await Thread.find({}, { images: 0 })
    .sort({ isPinned: -1, createdAt: -1 })
    .allowDiskUse(true);
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
  if (user.isBanned) return res.status(403).json({ message: 'You are banned' });

  // Rate-limit: 1 thread per minute per user (admin/owner exempt)
  if (user.role === 'user' && user.lastThreadAt) {
    const diff = Date.now() - new Date(user.lastThreadAt).getTime();
    if (diff < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - diff) / 1000);
      return res.status(429).json({ message: `You can only create 1 thread per minute. Please wait ${wait}s.` });
    }
  }

  const { title, content, sectionId, sectionName, images = [] } = req.body;
  if (!title || !sectionId || !sectionName) return res.status(400).json({ message: 'Missing required fields' });

  // Defensive: refuse to store base64 image blobs inside the document.
  // All images must be hosted (Cloudinary returns proper https URLs).
  // Without this guard, even one buggy client could refill the database.
  const safeImages = Array.isArray(images)
    ? images.filter((u) => typeof u === 'string' && !u.startsWith('data:'))
    : [];

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
    images: safeImages,
  });
  user.postCount += 1;
  user.lastThreadAt = new Date();
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

exports.deleteComment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const isAuthor = comment.authorId && comment.authorId.toString() === user._id.toString();
    const isModerator = user.role === 'owner' || user.role === 'admin';
    if (!isAuthor && !isModerator) {
      return res.status(403).json({ message: 'Forbidden: only the author, an admin, or the owner can delete this comment' });
    }
    const thread = await Thread.findById(comment.threadId);
    const authorId = comment.authorId;
    await comment.deleteOne();
    if (thread) {
      thread.commentCount = Math.max(0, (thread.commentCount || 1) - 1);
      await thread.save();
    }
    if (authorId) {
      const author = await User.findById(authorId);
      if (author) {
        author.commentCount = Math.max(0, (author.commentCount || 1) - 1);
        await author.save();
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createComment = async (req, res) => {
  const user = await User.findById(req.user.id);
  const thread = await Thread.findById(req.params.id);
  if (!user || !thread) return res.status(404).json({ message: 'Thread or user not found' });
  if (user.isBanned) return res.status(403).json({ message: 'You are banned' });
  if (thread.isLocked) return res.status(403).json({ message: 'Thread is locked' });

  // Rate-limit: 1 comment per minute per user (admin/owner exempt)
  if (user.role === 'user' && user.lastCommentAt) {
    const diff = Date.now() - new Date(user.lastCommentAt).getTime();
    if (diff < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - diff) / 1000);
      return res.status(429).json({ message: `You can only post 1 comment per minute. Please wait ${wait}s.` });
    }
  }

  const { content, images = [] } = req.body;
  if (!content && images.length === 0) return res.status(400).json({ message: 'Comment cannot be empty' });

  // Defensive: same base64 guard as createThread.
  const safeImages = Array.isArray(images)
    ? images.filter((u) => typeof u === 'string' && !u.startsWith('data:'))
    : [];

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
    images: safeImages,
  });
  thread.commentCount += 1;
  thread.lastCommentAt = new Date();
  thread.lastCommentBy = user.username;
  await thread.save();
  user.commentCount += 1;
  user.lastCommentAt = new Date();
  await user.save();

  // Notify thread author (server-side, persisted) — skip self-replies & muted threads
  try {
    const threadAuthorId = thread.authorId?.toString?.() || thread.authorId;
    if (threadAuthorId && threadAuthorId !== user._id.toString()) {
      const author = await User.findById(threadAuthorId).select('mutedThreads');
      const isMuted = (author?.mutedThreads || []).some(m => m && m.threadId === thread._id.toString());
      if (!isMuted) {
        await Notification.create({
          userId: threadAuthorId,
          type: 'thread_reply',
          message: `${user.username} replied to your thread "${thread.title}"`,
          link: `/thread/${thread._id.toString()}`,
          threadId: thread._id.toString(),
          threadTitle: thread.title,
          commentId: comment._id.toString(),
          commentAuthorName: user.username,
        });
      }
    }
  } catch (e) {
    console.error('notification create failed', e);
  }

  res.status(201).json({ comment: mapComment(comment) });
};

// ============================================
// VOTE ON COMMENT — also updates author's karma
// ============================================
exports.voteComment = async (req, res) => {
  try {
    const { vote } = req.body;
    if (!['up', 'down'].includes(vote)) return res.status(400).json({ message: 'Invalid vote' });

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user.id;
    if (comment.authorId.toString() === userId) {
      return res.status(400).json({ message: 'You cannot vote on your own comment' });
    }

    const votes = Array.isArray(comment.votes) ? [...comment.votes] : [];
    const existing = votes.find(v => v.userId === userId);
    let karmaChange = 0;
    let upvotes = comment.upvotes || 0;
    let downvotes = comment.downvotes || 0;

    if (existing && existing.vote === vote) {
      // Toggle off
      const idx = votes.findIndex(v => v.userId === userId);
      votes.splice(idx, 1);
      if (vote === 'up') { upvotes -= 1; karmaChange = -1; }
      else { downvotes -= 1; karmaChange = 1; }
    } else if (existing) {
      // Switch direction
      existing.vote = vote;
      existing.votedAt = new Date().toISOString();
      if (vote === 'up') { upvotes += 1; downvotes -= 1; karmaChange = 2; }
      else { upvotes -= 1; downvotes += 1; karmaChange = -2; }
    } else {
      votes.push({ userId, vote, votedAt: new Date().toISOString() });
      if (vote === 'up') { upvotes += 1; karmaChange = 1; }
      else { downvotes += 1; karmaChange = -1; }
    }

    comment.votes = votes;
    comment.upvotes = Math.max(0, upvotes);
    comment.downvotes = Math.max(0, downvotes);
    await comment.save();

    // Update author karma
    let authorKarma = 0;
    if (karmaChange !== 0) {
      const author = await User.findById(comment.authorId);
      if (author) {
        author.karma = (author.karma || 0) + karmaChange;
        await author.save();
        authorKarma = author.karma;
      }
    }

    res.json({
      comment: mapComment(comment),
      karmaChange,
      authorId: comment.authorId.toString(),
      authorKarma,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.mapThread = mapThread;
exports.mapComment = mapComment;
