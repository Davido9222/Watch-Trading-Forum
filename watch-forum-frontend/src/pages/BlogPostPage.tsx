// ============================================
// BLOG POST PAGE
// Serves pre-translated static URLs: /blog/:slug (English)
// and /blog/:lang/:slug (any other language).
// Content and SEO meta are fully pre-translated — never live-translated.
// ============================================

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';
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
  const { getOriginalPostByAnySlug, getTranslatedPost, posts, incrementViews, deletePost } = useBlogStore();
  const { isOwner } = useAuthStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Always find the base English post first (works for both English and translated slugs)
  const originalPost = slug ? getOriginalPostByAnySlug(slug) : undefined;

  // Determine which language to display: URL lang param wins; fall back to English
  const displayLang = lang || 'en';

  // Get the post with translation applied (or English if no lang / no translation)
  const post = originalPost
    ? (displayLang !== 'en' ? getTranslatedPost(originalPost, displayLang) : originalPost)
    : undefined;

  // Handle initial loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Increment view count once per load
  useEffect(() => {
    if (originalPost) {
      incrementViews(originalPost.id);
    }
  }, [originalPost?.id]);

  const handleDelete = () => {
    if (originalPost) {
      deletePost(originalPost.id);
      navigate('/blog');
    }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const localeFor: Record<string, string> = {
    en: 'en-US', zh: 'zh-CN', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR',
    ar: 'ar-SA', bn: 'bn-BD', pt: 'pt-PT', ru: 'ru-RU', nl: 'nl-NL',
    ur: 'ur-PK', id: 'id-ID', de: 'de-DE', ja: 'ja-JP', pcm: 'en-NG', mr: 'mr-IN',
  };

  const formatDate = (dateString: string) => {
    const locale = localeFor[displayLang] || 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const estimateReadTime = (content: string) =>
    Math.ceil(content.split(/\s+/).length / 200);

  // Related posts — always in English list
  const getRelatedPosts = () => {
    if (!originalPost) return [];
    return posts
      .filter(p => p.id !== originalPost.id && p.tags.some(tag => originalPost.tags.includes(tag)))
      .slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post || !originalPost) {
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

  // Available translations — derived from the base English post
  const availableTranslations = originalPost.translations
    ? Object.keys(originalPost.translations).filter(
        code => SUPPORTED_LANGUAGES.some(l => l.code === code),
      )
    : [];

  // The English slug is always on the base post
  const englishSlug = originalPost.slug;

  // Canonical URL for this language version
  const siteOrigin = 'https://watch-trading-forum.onrender.com';
  const canonicalUrl = displayLang === 'en'
    ? `${siteOrigin}/blog/${englishSlug}`
    : `${siteOrigin}/blog/${displayLang}/${post.slug}`;

  // SEO meta — pre-translated
  const seoTitle = post.metaTitle || post.title;
  const seoDescription = post.metaDescription || post.excerpt;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── SEO Head ── */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {originalPost.featuredImage && (
          <meta property="og:image" content={originalPost.featuredImage} />
        )}
        {/* hreflang for English */}
        <link rel="alternate" hrefLang="en" href={`${siteOrigin}/blog/${englishSlug}`} />
        {/* hreflang for each available translation */}
        {availableTranslations.map(code => {
          const tSlug = originalPost.translations![code].slug;
          return (
            <link
              key={code}
              rel="alternate"
              hrefLang={code === 'zh' ? 'zh-CN' : code}
              href={`${siteOrigin}/blog/${code}/${tSlug}`}
            />
          );
        })}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: seoTitle,
            description: seoDescription,
            url: canonicalUrl,
            datePublished: originalPost.publishedAt,
            dateModified: originalPost.updatedAt,
            author: { '@type': 'Person', name: originalPost.authorName },
            image: originalPost.featuredImage,
            keywords: originalPost.tags.join(', '),
          })}
        </script>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Link to="/blog">
              <Button variant="ghost" className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            {/* Language Selector — flags link to static pre-translated URLs */}
            {availableTranslations.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Read in:</span>
                <div className="flex gap-1">
                  {/* English flag — always links to the original English slug */}
                  <Link
                    to={`/blog/${englishSlug}`}
                    className={`px-2 py-1 text-sm rounded ${!lang ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="English"
                  >
                    🇬🇧
                  </Link>
                  {/* Each translated language links to its own static URL */}
                  {availableTranslations.map(code => {
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
                    if (!langInfo) return null;
                    const tSlug = originalPost.translations![code].slug;
                    return (
                      <Link
                        key={code}
                        to={`/blog/${code}/${tSlug}`}
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
                  <Link to={`/blog/edit/${englishSlug}`}>
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
      {originalPost.featuredImage && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={originalPost.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {originalPost.tags.map((tag, i) => (
              <Badge key={i} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title — pre-translated */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
            {post.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-200">
            <Link to={`/profile/${originalPost.authorName}`} className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors">
              <Avatar className="h-12 w-12">
                <AvatarImage src={originalPost.authorAvatar} />
                <AvatarFallback>{originalPost.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{originalPost.authorName}</p>
                <p className="text-sm text-gray-500">Author</p>
              </div>
            </Link>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(originalPost.publishedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {estimateReadTime(post.content)} min read
              </span>
            </div>
          </div>

          {/* Content — pre-translated HTML */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Author Bio */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About the Author</h3>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={originalPost.authorAvatar} />
                  <AvatarFallback>{originalPost.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Link to={`/profile/${originalPost.authorName}`}>
                    <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{originalPost.authorName}</p>
                  </Link>
                  <p className="text-gray-600 mt-1">
                    Experienced watch trader and collector contributing to the Watch Trading Forums community.
                    Sharing insights on luxury timepieces, market trends, and trading strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {related.featuredImage ? (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={related.featuredImage}
                            alt={related.title}
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
                          {related.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatDate(related.publishedAt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{originalPost.title}&quot;? This action cannot be undone.
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
