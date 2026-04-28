import { Request, Response } from "express";
import Thread from "../models/Thread";
import Comment from "../models/Comment";
import User from "../models/User";

function mapThread(thread: any) {
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

function mapComment(comment: any) {
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

export const listThreads = async (_req: Request, res: Response) => {
  const threads = await Thread.find().sort({ isPinned: -1, createdAt: -1 });
  res.json({ threads: threads.map(mapThread) });
};

export const getThread = async (req: Request, res: Response) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found" }) as any;
  const comments = await Comment.find({ threadId: thread._id }).sort({ createdAt: 1 });
  res.json({ thread: mapThread(thread), comments: comments.map(mapComment) });
};

export const createThread = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  if (!user) return res.status(404).json({ message: "User not found" }) as any;
  const { title, content, sectionId, sectionName, images = [] } = req.body;
  if (!title || !sectionId || !sectionName) return res.status(400).json({ message: "Missing required fields" }) as any;
  const thread = await Thread.create({
    title,
    content: content || "",
    authorId: user._id,
    authorName: user.username,
    authorAvatar: user.avatar,
    authorRole: user.role,
    authorMotto: user.motto,
    authorDonorGif: (user as any).donorGif || "",
    sectionId,
    sectionName,
    images,
  });
  (user as any).postCount += 1;
  await user.save();
  res.status(201).json({ thread: mapThread(thread) });
};

export const incrementViewCount = async (req: Request, res: Response) => {
  const thread = await Thread.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { new: true });
  if (!thread) return res.status(404).json({ message: "Thread not found" }) as any;
  res.json({ thread: mapThread(thread) });
};

export const updateThreadFlags = async (req: Request, res: Response) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found" }) as any;
  if (req.body.isPinned !== undefined) thread.isPinned = !!req.body.isPinned;
  if (req.body.isLocked !== undefined) thread.isLocked = !!req.body.isLocked;
  await thread.save();
  res.json({ thread: mapThread(thread) });
};

export const deleteThread = async (req: Request, res: Response) => {
  const thread = await Thread.findById(req.params.id);
  if (!thread) return res.status(404).json({ message: "Thread not found" }) as any;
  await Comment.deleteMany({ threadId: thread._id });
  await thread.deleteOne();
  res.json({ success: true });
};

export const deleteComment = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  if (!user) return res.status(404).json({ message: "User not found" }) as any;
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found" }) as any;
  const isAuthor = comment.authorId?.toString() === (user._id as any).toString();
  const isModerator = user.role === "owner" || user.role === "admin";
  if (!isAuthor && !isModerator) return res.status(403).json({ message: "Forbidden: only the author, an admin, or the owner can delete this comment" }) as any;
  const thread = await Thread.findById(comment.threadId);
  await comment.deleteOne();
  if (thread) {
    (thread as any).commentCount = Math.max(0, ((thread as any).commentCount || 1) - 1);
    await thread.save();
  }
  const author = await User.findById(comment.authorId);
  if (author) {
    (author as any).commentCount = Math.max(0, ((author as any).commentCount || 1) - 1);
    await author.save();
  }
  res.json({ success: true });
};

export const createComment = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  const thread = await Thread.findById(req.params.id);
  if (!user || !thread) return res.status(404).json({ message: "Thread or user not found" }) as any;
  const { content, images = [] } = req.body;
  if (!content && images.length === 0) return res.status(400).json({ message: "Comment cannot be empty" }) as any;
  const comment = await Comment.create({
    threadId: thread._id,
    content: content || "",
    authorId: user._id,
    authorName: user.username,
    authorAvatar: user.avatar,
    authorRole: user.role,
    authorMotto: user.motto,
    authorDonorGif: (user as any).donorGif || "",
    authorBadges: (user as any).badges || [],
    authorHallOfShame: (user as any).hallOfShame || undefined,
    images,
  });
  (thread as any).commentCount += 1;
  (thread as any).lastCommentAt = new Date();
  (thread as any).lastCommentBy = user.username;
  await thread.save();
  (user as any).commentCount += 1;
  await user.save();
  res.status(201).json({ comment: mapComment(comment) });
};
