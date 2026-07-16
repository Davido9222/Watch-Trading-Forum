// ============================================
// BLOG EDITOR PAGE
// Create and edit blog posts (Owner only).
//
// Rich-text editor: uses a contenteditable div with a toolbar
// (Bold, Italic, H2, H3, Bullet list, Numbered list, Link) —
// no additional npm packages required.
//
// Translation flow:
//   1. Owner clicks "Publish Post"
//   2. Post is saved to the backend immediately
//   3. Translation starts and owner sees a live progress bar:
//      "Translating 3 / 14 — French…"
//   4. After ALL languages complete, owner is navigated to the
//      post page where every flag is already showing. No visitor
//      ever sees a "translating…" banner.
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X, Plus, Save, Eye, ArrowLeft, Trash2,
  Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon,
} from 'lucide-react';

// ─── Minimal rich-text toolbar ──────────────────────────────────────────────
// Uses document.execCommand — works in all modern browsers, no library needed.

interface ToolbarButtonProps {
  onMouseDown: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onMouseDown, title, children, active }) => (
  <button
    type="button"
    title={title}
    onMouseDown={onMouseDown}
    className={`p-1.5 rounded text-sm hover:bg-gray-200 transition-colors ${
      active ? 'bg-gray-200 text-blue-700' : 'text-gray-700'
    }`}
  >
    {children}
  </button>
);

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || '';
      isInitialized.current = true;
    }
  }, []);

  // Sync incoming value changes (e.g. when loading an existing post)
  useEffect(() => {
    if (editorRef.current && isInitialized.current) {
      // Only update DOM if content actually differs (prevents cursor jump)
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const exec = useCallback((e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault(); // keep focus in editor
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInsertLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      editorRef.current?.focus();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
  };

  const handleH2 = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand('formatBlock', false, 'h2');
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleH3 = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand('formatBlock', false, 'h3');
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleP = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand('formatBlock', false, 'p');
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-input">
        <ToolbarButton onMouseDown={(e) => exec(e, 'bold')} title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onMouseDown={(e) => exec(e, 'italic')} title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <ToolbarButton onMouseDown={handleH2} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onMouseDown={handleH3} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <ToolbarButton onMouseDown={handleP} title="Normal paragraph">
          <span className="text-xs">¶</span>
        </ToolbarButton>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <ToolbarButton onMouseDown={(e) => exec(e, 'insertUnorderedList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onMouseDown={(e) => exec(e, 'insertOrderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <ToolbarButton onMouseDown={handleInsertLink} title="Insert link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="w-px h-4 bg-gray-300 mx-1" />

        <ToolbarButton onMouseDown={(e) => exec(e, 'undo')} title="Undo">
          <span className="text-xs">↩</span>
        </ToolbarButton>
        <ToolbarButton onMouseDown={(e) => exec(e, 'redo')} title="Redo">
          <span className="text-xs">↪</span>
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={[
          'min-h-[400px] p-3 outline-none text-sm',
          'prose prose-sm max-w-none',
          'prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg',
          'prose-p:my-1 prose-ul:pl-5 prose-ol:pl-5',
          '[&:empty]:before:content-[attr(data-placeholder)]',
          '[&:empty]:before:text-muted-foreground',
          '[&:empty]:before:pointer-events-none',
        ].join(' ')}
      />
    </div>
  );
};

// ─── Blog Editor Page ────────────────────────────────────────────────────────

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
    translationProgress,
  } = useBlogStore();

  const isEditing = !!slug;
  const existingPost = slug ? getOriginalPostByAnySlug(slug) : undefined;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Publishing state
  const [phase, setPhase] = useState<'idle' | 'saving' | 'translating' | 'done'>('idle');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const progress = currentPostId ? translationProgress[currentPostId] : null;

  useEffect(() => {
    if (!isOwner()) navigate('/blog');
  }, [isOwner, navigate]);

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
  }, [existingPost?.id]);

  // Navigate as soon as translation finishes (translationProgress key removed = done)
  useEffect(() => {
    if (phase === 'translating' && currentPostId && !translationProgress[currentPostId]) {
      setPhase('done');
      const post = getOriginalPostByAnySlug(slug || '') || { slug: generateSlug(title) };
      navigate(`/blog/${'slug' in post ? post.slug : generateSlug(title)}`);
    }
  }, [translationProgress, currentPostId, phase]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    if (!currentUser) return;

    setError('');
    setPhase('saving');

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
      let postId: string;

      if (isEditing && existingPost) {
        await updatePost(existingPost.id, postData);
        postId = existingPost.id;
      } else {
        const newPost = await createPost(postData);
        postId = newPost.id;
      }

      // Phase 2: translate all languages — AWAIT so owner sees all flags on arrival
      setCurrentPostId(postId);
      setPhase('translating');
      await translatePost(postId);
      // Navigation is handled by the useEffect above watching translationProgress

    } catch (err: any) {
      setError(err?.message || 'Failed to save post. Please try again.');
      setPhase('idle');
    }
  };

  const handleDelete = async () => {
    if (
      existingPost &&
      confirm('Are you sure you want to delete this post? This cannot be undone.')
    ) {
      await deletePostWithTranslations(existingPost.id);
      navigate('/blog');
    }
  };

  const isPublishing = phase === 'saving' || phase === 'translating';

  // ─── Publishing overlay ──────────────────────────────────────────────────────
  if (isPublishing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-600 border-t-transparent mx-auto mb-6" />

          {phase === 'saving' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Saving post…</h2>
              <p className="text-gray-500 text-sm">Just a moment.</p>
            </>
          )}

          {phase === 'translating' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Translating your post
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Please wait — this runs once so every visitor sees instant translations.
              </p>

              {progress && (
                <>
                  <div className="text-sm font-medium text-blue-700 mb-2">
                    {progress.current < progress.total
                      ? `${progress.current + 1} / ${progress.total} — ${progress.language}`
                      : `${progress.total} / ${progress.total} — Saving…`}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((progress.current) / progress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Do not close this tab
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Main editor ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/blog')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit Post' : 'New Blog Post'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isEditing
                  ? 'Update post — all 14 language translations will regenerate.'
                  : 'Write your post. All 14 language translations are generated before publishing.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && existingPost && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`/blog/${existingPost.slug}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button onClick={handleSubmit} disabled={isPublishing}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Post Details */}
          <Card>
            <CardHeader><CardTitle>Post Details</CardTitle></CardHeader>
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
                    URL: /blog/{generateSlug(title)}
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

          {/* Content editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content *</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Start writing your post here…"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use the toolbar to add headings, bold, lists, and links.
                The full content (including all formatting) will be translated into 14 languages.
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
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
            <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
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

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPublishing} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Post' : 'Publish Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
