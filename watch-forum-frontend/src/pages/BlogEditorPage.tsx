// ============================================
// BLOG EDITOR PAGE
// Create and edit blog posts (Owner only).
// Translation starts in the background immediately after the
// post is saved — the owner is navigated to the post right away
// and the language flags appear once translation completes.
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Eye, ArrowLeft, Trash2 } from 'lucide-react';

export const BlogEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isOwner } = useAuthStore();
  const {
    createPost,
    updatePost,
    getOriginalPostByAnySlug,
    deletePostWithTranslations,
    translatePost,
  } = useBlogStore();

  const isEditing = !!slug;
  const existingPost = slug ? getOriginalPostByAnySlug(slug) : undefined;

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not owner
  useEffect(() => {
    if (!isOwner()) navigate('/blog');
  }, [isOwner, navigate]);

  // Populate form when editing
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setExcerpt(existingPost.excerpt);
      setContent(existingPost.content);
      setFeaturedImage(existingPost.featuredImage || '');
      setTags(existingPost.tags);
      setMetaTitle(existingPost.metaTitle || '');
      setMetaDescription(existingPost.metaDescription || '');
    }
  }, [existingPost]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    if (!currentUser) return;

    setIsSubmitting(true);
    setError('');

    const postData = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      featuredImage: featuredImage.trim() || undefined,
      tags,
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      slug: generateSlug(title),
      metaTitle: metaTitle.trim() || title.trim(),
      metaDescription: metaDescription.trim() || excerpt.trim(),
    };

    try {
      if (isEditing && existingPost) {
        // Update existing post
        await updatePost(existingPost.id, postData);
        // Start translation in background — do NOT await (can take minutes)
        translatePost(existingPost.id);
        navigate(`/blog/${postData.slug}`);
      } else {
        // Create new post
        const newPost = await createPost(postData);
        // Start translation in background — do NOT await
        translatePost(newPost.id);
        navigate(`/blog/${newPost.slug}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save post. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      existingPost &&
      confirm(
        'Are you sure you want to delete this post? This cannot be undone.',
      )
    ) {
      await deletePostWithTranslations(existingPost.id);
      navigate('/blog');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/blog')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit Post' : 'New Blog Post'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing
                  ? 'Update and republish. Translation will restart automatically.'
                  : 'Publish and translations will generate in the background.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && existingPost && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/blog/${existingPost.slug}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Post
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving…' : isEditing ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  className="mt-1"
                />
                {title && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: /blog/{generateSlug(title)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Brief summary shown in blog listings…"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={featuredImage}
                  onChange={e => setFeaturedImage(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="mt-1"
                />
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt="Preview"
                    className="mt-2 h-32 w-full object-cover rounded-md"
                    onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="content">HTML Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="<h2>Section Title</h2><p>Your content here…</p>"
                rows={20}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Accepts HTML. Use &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;/&lt;li&gt;,
                &lt;strong&gt; etc. All text inside tags will be translated automatically.
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  placeholder="Defaults to post title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  placeholder="Defaults to excerpt"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving…' : isEditing ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
