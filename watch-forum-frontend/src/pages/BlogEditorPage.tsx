// ============================================
// BLOG EDITOR PAGE
// Create and edit blog posts (Owner only)
// Auto-translates to all languages for SEO
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';
import { getTranslationUrls } from '@/services/translationService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Eye, ArrowLeft, Globe, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';

export const BlogEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isOwner } = useAuthStore();
  const { createPost, updatePost, getOriginalPostByAnySlug, deletePostWithTranslations } = useBlogStore();

  const isEditing = !!slug;
  // Use getOriginalPostByAnySlug to find the post from any slug (English or translated)
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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Redirect if not owner
  useEffect(() => {
    if (!isOwner()) {
      navigate('/blog');
    }
  }, [isOwner, navigate]);

  // Load existing post data if editing
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
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);

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

    if (isEditing && existingPost) {
      updatePost(existingPost.id, postData);
      navigate(`/blog/${postData.slug}`);
    } else {
      const newPost = createPost(postData);
      navigate(`/blog/${newPost.slug}`);
    }

    setIsSubmitting(false);
  };

  const handleDelete = () => {
    if (existingPost && confirm('Are you sure you want to delete this post and all its translations? This cannot be undone.')) {
      deletePostWithTranslations(existingPost.id);
      navigate('/blog');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title || 'Preview'} - Watch Trading Forums</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
            h1 { font-size: 2.5em; margin-bottom: 0.5em; }
            .meta { color: #666; margin-bottom: 2em; }
            .excerpt { font-size: 1.2em; color: #444; font-style: italic; margin-bottom: 2em; padding: 20px; background: #f5f5f5; border-left: 4px solid #0066cc; }
            img { max-width: 100%; height: auto; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>${title || 'Untitled'}</h1>
          <div class="meta">By ${currentUser?.username || 'Anonymous'}</div>
          <div class="excerpt">${excerpt}</div>
          ${featuredImage ? `<img src="${featuredImage}" alt="${title}">` : ''}
          <div>${content}</div>
        </body>
        </html>
      `);
    }
  };

  // Get translation URLs if editing
  const translationUrls = existingPost 
    ? getTranslationUrls(existingPost.slug, existingPost.translations || {})
    : [];

  if (!isOwner()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !title.trim() || !excerpt.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Edit Article' : 'Create New Article'}
        </h1>

        {/* Translation URLs - Only show when editing */}
        {isEditing && translationUrls.length > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Globe className="h-5 w-5" />
                SEO Translation URLs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                This article has been auto-translated to {translationUrls.length - 1} languages for SEO. 
                Only the English version appears in the blog list, but Google crawlers will find all versions.
              </p>
              <div className="space-y-2">
                {translationUrls.map(({ lang, flag, name, url }) => (
                  <div key={lang} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <span className="text-xl">{flag}</span>
                    <span className="text-sm font-medium w-24">{name}</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">{url}</code>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopyUrl(url)}
                      >
                        {copiedUrl === url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Link to={url} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader>
              <CardTitle>Article Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a compelling title..."
                className="text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                URL slug: /blog/{generateSlug(title) || 'your-article-slug'}
              </p>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a brief summary that will appear in search results and previews..."
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-2">
                {excerpt.length} characters. Recommended: 150-160 characters for SEO.
              </p>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {featuredImage && (
                <div className="mt-4">
                  <img 
                    src={featuredImage} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here. HTML tags are supported."
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supports HTML formatting. Use &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;li&gt; tags.
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <Badge key={tag} className="bg-blue-100 text-blue-700">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title (optional)</Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || 'Custom title for search engines'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Defaults to article title if empty
                </p>
              </div>
              <div>
                <Label>Meta Description (optional)</Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || 'Custom description for search engines'}
                  rows={2}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Defaults to excerpt if empty
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Translation Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Globe className="h-5 w-5" />
                Auto-Translation for SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 mb-2">
                When you publish this article, it will be automatically translated to all {SUPPORTED_LANGUAGES.length - 1} supported languages.
              </p>
              <p className="text-sm text-blue-700 mb-4">
                Only the English version will appear in the blog list, but Google crawlers will index all language versions for better SEO.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                  <Badge key={lang.code} variant="outline" className="bg-white">
                    {lang.flag} {lang.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogEditorPage;
