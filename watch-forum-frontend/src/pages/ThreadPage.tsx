// ============================================
// THREAD PAGE
// Notifications are now created on the BACKEND
// when a comment is posted, so they show up on
// any device the thread author signs in on.
// We also surface server rate-limit errors
// (1 thread + 1 comment per minute).
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { CommentCard } from '@/components/forum/CommentCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pin, Lock, Unlock, Trash2, ArrowLeft, MessageSquare, Eye, Image as ImageIcon, X } from 'lucide-react';
import { uploadImage } from '@/utils/imageUpload';
import type { UploadResult } from '@/utils/imageUpload';

export const ThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const {
    getThreadById,
    getCommentsByThread,
    createComment,
    loadThread,
    incrementViewCount,
    pinThread,
    unpinThread,
    lockThread,
    unlockThread,
    deleteThread,
    getSectionById,
  } = useForumStore();
  const { isAuthenticated, currentUser, canModerate, isOwner } = useAuthStore();

  const [commentText, setCommentText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thread = threadId ? getThreadById(threadId) : undefined;
  const comments = threadId ? getCommentsByThread(threadId) : [];
  const section = thread ? getSectionById(thread.sectionId) : undefined;

  useEffect(() => {
    if (threadId) {
      incrementViewCount(threadId);
      loadThread(threadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const result: UploadResult = await uploadImage(files[i]);
      if (result.success && result.url) {
        setUploadedImages((prev) => [...prev, result.url!]);
      } else {
        alert(result.error || 'Failed to upload image');
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostComment = async () => {
    if (!isAuthenticated || !currentUser || !thread || posting) return;
    if (!commentText.trim() && uploadedImages.length === 0) return;

    setPosting(true);
    setPostError(null);
    try {
      await createComment({
        threadId: thread.id,
        content: commentText,
        authorId: currentUser.id,
        authorName: currentUser.username,
        authorAvatar: currentUser.avatar,
        authorRole: currentUser.role,
        authorMotto: currentUser.motto,
        authorDonorGif: currentUser.donorGif,
        authorBadges: currentUser.badges || [],
        authorHallOfShame: currentUser.hallOfShame,
        images: uploadedImages,
      });
      // The server now creates the notification for the thread author
      // (and respects mutedThreads), so nothing extra to do here.
      setCommentText('');
      setUploadedImages([]);
    } catch (err: any) {
      setPostError(err?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = (_commentId: string) => {
    alert('Delete comment functionality would be implemented here');
  };

  const handlePinThread = async () => {
    if (!thread || !isOwner()) return;
    if (thread.isPinned) await unpinThread(thread.id);
    else await pinThread(thread.id);
  };

  const handleLockThread = async () => {
    if (!thread || !canModerate()) return;
    if (thread.isLocked) await unlockThread(thread.id);
    else await lockThread(thread.id);
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    if (canModerate() || currentUser?.id === thread.authorId) {
      await deleteThread(thread.id);
      navigate(`/forum/${section?.slug}`);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thread Not Found</h1>
          <p className="text-gray-600 mb-6">The thread you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canComment = isAuthenticated && !thread.isLocked;
  const canModerateThread = canModerate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            {section && (
              <>
                <Link to={`/forum/${section.slug}`} className="hover:text-blue-600">
                  {section.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 truncate max-w-[300px]">{thread.title}</span>
          </div>

          <div className="flex items-start gap-3 flex-wrap mb-4">
            {thread.isPinned && (
              <Badge className="bg-blue-600 text-white">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}
            {thread.isLocked && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{thread.title}</h1>

          <div className="flex items-center gap-4 flex-wrap">
            <Link to={`/profile/${thread.authorName}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.authorAvatar} />
                <AvatarFallback>{thread.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900">{thread.authorName}</div>
                <div className="text-sm text-gray-500">{formatDate(thread.createdAt)}</div>
              </div>
            </Link>

            <div className="flex items-center gap-4 ml-auto text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{thread.viewCount.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{thread.commentCount} comments</span>
              </div>
            </div>
          </div>

          {canModerateThread && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              {isOwner() && (
                <Button variant="outline" size="sm" onClick={handlePinThread}>
                  <Pin className="h-4 w-4 mr-1" />
                  {thread.isPinned ? 'Unpin' : 'Pin'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLockThread}>
                {thread.isLocked ? (
                  <><Unlock className="h-4 w-4 mr-1" />Unlock</>
                ) : (
                  <><Lock className="h-4 w-4 mr-1" />Lock</>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Thread</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this thread? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteThread}>Delete Thread</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap">{thread.content}</p>
          </div>
          {thread.images && thread.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {thread.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thread image ${index + 1}`}
                  className="max-w-[300px] max-h-[300px] object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Comments ({thread.commentCount})
          </h2>
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to reply!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUser?.id}
                  currentUserRole={currentUser?.role}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>

        {canComment ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post a Reply</h3>
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[120px] mb-4"
            />

            {uploadedImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Attached images:</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border border-gray-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {postError && (
              <p className="text-sm text-red-600 mb-3">{postError}</p>
            )}

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Add Images'}
              </Button>

              <Button
                onClick={handlePostComment}
                disabled={(!commentText.trim() && uploadedImages.length === 0) || posting}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {posting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Only image files (.jpg, .png, .gif, .webp) are allowed. Max file size: 5MB. You can post 1 comment per minute.
            </p>
          </div>
        ) : thread.isLocked ? (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
            <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">This thread is locked. No new comments can be posted.</p>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Please <Link to="/login" className="text-blue-600 hover:underline">sign in</Link> to post a comment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadPage;
