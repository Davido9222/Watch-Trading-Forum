// ============================================
// BLOG POST PAGE
// Individual blog post with multilingual SEO support.
// FIX: getTranslatedPost is now called explicitly in this component so the
// correct translated title / content is always shown when the language changes,
// regardless of how the URL was formed.
// ============================================

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, ArrowLeft, Share2, Tag, Edit, Trash2, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const BlogPostPage: React.FC = () => {
  const { slug, lang } = useParams<{ slug: string; lang?: string }>();
  const navigate = useNavigate();

  // ── Store subscriptions ────────────────────────────────────────────────────
  const { posts, getPostBySlug, getTranslatedPost, incrementViews, deletePost } = useBlogStore();
  const { isOwner } = useAuthStore();
  const { currentLanguage, t } = useLanguageStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading]               = useState(true);

  // ── Determine display language ─────────────────────────────────────────────
  // Priority: URL :lang param  >  user language preference  >  English
  const displayLang = lang || currentLanguage || 'en';

  // ── Find the raw English post by any slug variant ─────────────────────────
  // We always find the source post first, then apply translation separately.
  // This is more reliable than relying on getPostBySlug to do both in one call.
  const rawPost = useMemo(() => {
    if (!slug) return undefined;
    // Try to find the post by the slug in URL (could be English or translated slug)
    return getPostBySlug(slug, 'en') ?? getPostBySlug(slug, displayLang);
  }, [slug, posts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply translation ──────────────────────────────────────────────────────
  // useMemo re-runs whenever displayLang changes (language selector or URL param).
  const post = useMemo(() => {
    if (!rawPost) return undefined;
    if (displayLang === 'en') return rawPost;
    return getTranslatedPost(rawPost, displayLang);
  }, [rawPost, displayLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Is the content actually translated (different from English source)?
  const isTranslated = useMemo(() => {
    if (!rawPost || !post || displayLang === 'en') return true;
    return post.content !== rawPost.content;
  }, [rawPost, post, displayLang]);

  // ── Loading ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // ── View count ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (rawPost) incrementViews(rawPost.id);
  }, [rawPost?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = () => {
    if (rawPost) {
      deletePost(rawPost.id);
      navigate('/blog');
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    const localeMap: Record<string, string> = {
      en: 'en-US', zh: 'zh-CN', es: 'es-ES', fr: 'fr-FR',
      de: 'de-DE', ja: 'ja-JP', ru: 'ru-RU', nl: 'nl-NL',
      pt: 'pt-PT', ar: 'ar-SA',
    };
    return new Date(dateString).toLocaleDateString(localeMap[displayLang] || 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const estimateReadTime = (content: string) => {
    return Math.ceil(content.split(/\s+/).length / 200);
  };

  const getRelatedPosts = () => {
    if (!rawPost) return [];
    return posts
      .filter(p => p.id !== rawPost.id && p.tags.some(tag => rawPost.tags.includes(tag)))
      .slice(0, 3);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading article…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!post || !rawPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/blog"><Button>Back to Blog</Button></Link>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedPosts();

  // Available translations for this post
  const availableTranslations = rawPost.translations
    ? Object.keys(rawPost.translations).filter(code =>
        SUPPORTED_LANGUAGES.some(l => l.code === code)
      )
    : [];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    // key={displayLang} forces a full re-mount when language switches,
    // which guarantees dangerouslySetInnerHTML re-renders with fresh content.
    <div key={displayLang} className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Link to="/blog">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('blog.backToBlog')}
              </Button>
            </Link>

            {/* Language selector */}
            {availableTranslations.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Read in:</span>
                <div className="flex gap-1">
                  <Link
                    to={`/blog/${rawPost.slug}`}
                    className={`px-2 py-1 text-sm rounded ${!lang ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="English"
                  >
                    🇬🇧
                  </Link>
                  {availableTranslations.map((code) => {
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
                    if (!langInfo) return null;
                    const translatedSlug = rawPost.translations?.[code]?.slug || rawPost.slug;
                    return (
                      <Link
                        key={code}
                        to={`/blog/${code}/${translatedSlug}`}
                        className={`px-2 py-1 text-sm rounded ${lang === code ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                        title={langInfo.name}
                      >
                        {langInfo.flag}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {isOwner() && (
                <>
                  <Link to={`/blog/edit/${rawPost.slug}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      {rawPost.featuredImage && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={rawPost.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Translation notice */}
          {!isTranslated && displayLang !== 'en' && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Globe className="h-4 w-4 shrink-0" />
              <span>
                Translation not yet available for this article — showing in English.{' '}
                <Link to={`/blog/${rawPost.slug}`} className="underline hover:no-underline">
                  Switch to English
                </Link>
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {rawPost.tags.map((tag, i) => (
              <Badge key={i} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title (translated) */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
            {post.title}
          </h1>

          {/* Author & meta */}
          <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-200">
            <Link
              to={`/profile/${rawPost.authorName}`}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={rawPost.authorAvatar} />
                <AvatarFallback>{rawPost.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{rawPost.authorName}</p>
                <p className="text-sm text-gray-500">{t('blog.author')}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{t('blog.published')} {formatDate(rawPost.publishedAt)}</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{estimateReadTime(post.content)} {t('blog.minRead')}</span>
            </div>
          </div>

          {/* Body (translated content) */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Author card */}
          <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={rawPost.authorAvatar} />
                <AvatarFallback>{rawPost.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Link to={`/profile/${rawPost.authorName}`}>
                  <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    {rawPost.authorName}
                  </p>
                </Link>
                <p className="text-sm text-gray-500">Watch Trading Forums Contributor</p>
              </div>
            </div>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('blog.related')}</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => {
                  const relatedDisplay = displayLang !== 'en'
                    ? getTranslatedPost(related, displayLang)
                    : related;
                  return (
                    <Link
                      key={related.id}
                      to={
                        displayLang === 'en'
                          ? `/blog/${related.slug}`
                          : `/blog/${displayLang}/${related.translations?.[displayLang]?.slug || related.slug}`
                      }
                    >
                      <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full">
                        {related.featuredImage ? (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={related.featuredImage}
                              alt={relatedDisplay.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                            <span className="text-4xl">⌚</span>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {relatedDisplay.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-2">{formatDate(related.publishedAt)}</p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{rawPost.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogPostPage;
