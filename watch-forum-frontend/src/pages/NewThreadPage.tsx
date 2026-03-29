// ============================================
// NEW THREAD PAGE
// Create new thread with image uploads
// Security: Only image files allowed
// ============================================

import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Image as ImageIcon, X, Lock } from 'lucide-react';
import { uploadImage } from '@/utils/imageUpload';
import type { UploadResult } from '@/utils/imageUpload';

export const NewThreadPage: React.FC = () => {
  const { sectionSlug } = useParams<{ sectionSlug: string }>();
  const navigate = useNavigate();
  const { getSectionBySlug, createThread, canCreateThread } = useForumStore();
  const { currentUser, isAuthenticated, isOwner } = useAuthStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const section = sectionSlug ? getSectionBySlug(sectionSlug) : undefined;

  // Check rate limiting
  const rateLimitCheck = currentUser ? canCreateThread(currentUser.id) : { allowed: true };
  const isRateLimited = !rateLimitCheck.allowed;
  const timeRemaining = rateLimitCheck.timeRemaining;

  // Format time remaining for display
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.ceil(ms / (60 * 1000));
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${minutes}m`;
  };

  // canPost is now checked individually in the render conditions

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');
    
    for (let i = 0; i < files.length; i++) {
      const result: UploadResult = await uploadImage(files[i]);
      if (result.success && result.url) {
        setUploadedImages(prev => [...prev, result.url!]);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    }
    
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated || !currentUser) {
      setError('Please sign in to create a thread');
      return;
    }

    if (section?.requiresOwner && !isOwner()) {
      setError('Only the site owner can post in this section');
      return;
    }

    // Check rate limiting
    const rateCheck = canCreateThread(currentUser.id);
    if (!rateCheck.allowed) {
      setError(`You can only create one thread every 30 minutes. Please wait ${formatTimeRemaining(rateCheck.timeRemaining || 0)}.`);
      return;
    }

    if (!section) {
      setError('Section not found');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!content.trim() && uploadedImages.length === 0) {
      setError('Please enter content or attach images');
      return;
    }

    const thread = await createThread({
      title: title.trim(),
      content: content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      authorMotto: currentUser.motto,
      authorDonorGif: currentUser.donorGif,
      sectionId: section.id,
      sectionName: section.name,
      images: uploadedImages,
      isPinned: false,
      isLocked: false,
    });

    // Navigate to the new thread
    navigate(`/thread/${thread.id}`);
  };

  if (!section) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Section Not Found</h1>
          <p className="text-gray-600 mb-6">The forum section you're looking for doesn't exist.</p>
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

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to create a new thread.
          </p>
          <Link to={`/forum/${section.slug}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {section.name}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (section?.requiresOwner && !isOwner()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Only the site owner can post in this section.
          </p>
          <Link to={`/forum/${section.slug}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {section.name}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isRateLimited) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Rate Limit</h1>
          <p className="text-gray-600 mb-6">
            You can only create one thread every 30 minutes.
            <br />
            Please wait <strong>{formatTimeRemaining(timeRemaining || 0)}</strong> before creating another thread.
          </p>
          <Link to={`/forum/${section.slug}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {section.name}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/forum/${section.slug}`}
            className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {section.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Thread</h1>
          <p className="text-gray-600">Posting in: {section.name}</p>
          {section.requiresOwner && (
            <Badge className="mt-2 bg-purple-600 text-white">
              <Lock className="h-3 w-3 mr-1" />
              Owner Only Section
            </Badge>
          )}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thread Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter thread title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Images</Label>
                
                {/* Upload Button */}
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

                {/* Image Previews */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {uploadedImages.length} image(s) attached:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
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

                <p className="text-xs text-gray-500">
                  Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed. 
                  Maximum file size: 5MB per image.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" disabled={!title.trim()}>
                  Create Thread
                </Button>
                <Link to={`/forum/${section.slug}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewThreadPage;
