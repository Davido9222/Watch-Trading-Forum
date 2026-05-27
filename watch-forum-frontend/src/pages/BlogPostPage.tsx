// ============================================
// BLOG POST PAGE
// Individual blog post with multilingual SEO support
// key={displayLang} forces re-mount when language changes so translation is applied
// ============================================

import React, { useEffect, useMemo, useState } from 'react';
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
  const { posts, getPostBySlug, getTranslatedPost, incrementViews, deletePost, translatePost } = useBlogStore();
  const { isOwner } = useAuthStore();
  const { currentLanguage } = useLanguageStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  // Determine which language to display: URL param > user preference > English
  const displayLang = lang || currentLanguage || 'en';

  // Find the raw post (base/English) and the translated version
  const rawPost = useMemo(() => {
    if (!slug) return undefined;
    return getPostBySlug(slug, 'en') ?? getPostBySlug(slug, displayLang);
  }, [slug, displayLang, posts]);

  const post = useMemo(() => {
    if (!rawPost) return undefined;
    return typeof getTranslatedPost === 'function'
      ? getTranslatedPost(rawPost, displayLang)
      : rawPost;
  }, [rawPost, displayLang, posts]);

  // Detect placeholder translation: same title as English in a non-English context
  const hasPlaceholderTranslation = useMemo(() => {
    if (displayLang === 'en' || !rawPost) return false;
    const t = rawPost.translations?.[displayLang];
    if (!t) return true;
    // Placeholder = title unchanged from English (fallback content)
    return t.title === rawPost.title;
  }, [rawPost, displayLang]);

  // Auto-trigger real translation for posts with placeholder translations
  useEffect(() => {
    if (hasPlaceholderTranslation && rawPost && !isTranslating) {
      setIsTranslating(true);
      translatePost(rawPost.id).finally(() => setIsTranslating(false));
    }
  }, [rawPost?.id, hasPlaceholderTranslation]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (post) incrementViews(post.id);
  }, [post?.id]);

  const handleDelete = () => {
    if (post) { deletePost(post.id); navigate('/blog'); }
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try { await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href }); } catch {}
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

  const estimateReadTime = (content: string) =>
    Math.ceil(content.split(/\s+/).length / 200);

  const getRelatedPosts = () => {
    if (!post) return [];
    return posts
      .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
      .slice(0, 3);
  };

  const getAvailableTranslations = () => {
    if (!post?.translations) return [];
    return Object.keys(post.translations).filter(code => SUPPORTED_LANGUAGES.some(l => l.code === code));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
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
  const availableTranslations = getAvailableTranslations();

  return (
    <div className="min-h-screen bg-gray-50" key={displayLang}>
      {/* Translating banner — shown when real translation is being fetched */}
      {isTranslating && displayLang !== 'en' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-700 flex items-center justify-center gap-2">
          <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full" />
          Translating this article — please wait a moment…
        </div>
      )}
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

            {/* Language Selector */}
            {availableTranslations.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Read in:</span>
                <div className="flex gap-1">
                  <Link
                    to={`/blog/${post.slug}`}
                    className={`px-2 py-1 text-sm rounded ${!lang ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="English"
                  >
                    🇬🇧
                  </Link>
                  {availableTranslations.map((code) => {
                    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === code);
                    if (!langInfo) return null;
                    return (
                      <Link
                        key={code}
                        to={`/blog/${code}/${post.translations?.[code]?.slug || post.slug}`}
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
                  <Link to={`/blog/edit/${post.slug}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteDialogOpen(true)}>
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
      {post.featuredImage && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, i) => (
              <Badge key={i} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Tag className="h-3 w-3 mr-1" />{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-6 pb-8 mb-8 border-b border-gray-200">
            <Link to={`/profile/${post.authorName}`} className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback>{post.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{post.authorName}</p>
                <p className="text-sm text-gray-500">Author</p>
              </div>
            </Link>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {estimateReadTime(post.content)} min read
              </span>
            </div>
          </div>

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
                  <AvatarImage src={post.authorAvatar} />
                  <AvatarFallback>{post.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Link to={`/profile/${post.authorName}`}>
                    <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors">{post.authorName}</p>
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
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} to={lang ? `/blog/${lang}/${relatedPost.slug}` : `/blog/${relatedPost.slug}`}>
                    <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {relatedPost.featuredImage ? (
                        <div className="h-32 overflow-hidden">
                          <img src={relatedPost.featuredImage} alt={relatedPost.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                          <span className="text-4xl">⌚</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">{relatedPost.title}</h4>
                        <p className="text-sm text-gray-500 mt-2">{formatDate(relatedPost.publishedAt)}</p>
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
              Are you sure you want to delete &quot;{post.title}&quot;? This action cannot be undone.
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
