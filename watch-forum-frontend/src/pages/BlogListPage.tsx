// ============================================
// BLOG LIST PAGE
// SEO-optimized blog listing page with translations
// ============================================

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '@/stores/blogStore';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Search, Plus, Eye, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const BlogListPage: React.FC = () => {
  const { posts, searchQuery, setSearchQuery, getTranslatedPost } = useBlogStore();
  const { isOwner } = useAuthStore();
  const { currentLanguage, t } = useLanguageStore();

  // SEO: Update page title and meta tags
  useEffect(() => {
    document.title = 'Watch Trading Blog | Expert Guides, Reviews & Industry Insights';
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Discover expert watch trading guides, luxury watch reviews, market insights, and investment tips. Learn about Rolex, Patek Philippe, Audemars Piguet and more.');
    }
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://watchtradingforums.com/blog');
  }, []);

  // Get translated posts based on current language
  const getDisplayPost = (post: typeof posts[0]) => {
    if (currentLanguage === 'en') return post;
    return getTranslatedPost(post, currentLanguage);
  };

  const filteredPosts = posts.filter(post => {
    const displayPost = getDisplayPost(post);
    return displayPost.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayPost.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const formatDate = (dateString: string) => {
    const locale = currentLanguage === 'en' ? 'en-US' : 
                   currentLanguage === 'zh' ? 'zh-CN' :
                   currentLanguage === 'es' ? 'es-ES' :
                   currentLanguage === 'fr' ? 'fr-FR' :
                   currentLanguage === 'de' ? 'de-DE' :
                   currentLanguage === 'ja' ? 'ja-JP' :
                   currentLanguage === 'ru' ? 'ru-RU' :
                   currentLanguage === 'nl' ? 'nl-NL' :
                   currentLanguage === 'pt' ? 'pt-PT' :
                   currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Watch Trading Forums Blog',
    description: 'Expert watch trading guides, luxury watch reviews, and industry insights',
    url: 'https://watchtradingforums.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Watch Trading Forums',
      logo: {
        '@type': 'ImageObject',
        url: 'https://watchtradingforums.com/logo.png'
      }
    },
    blogPost: filteredPosts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      author: {
        '@type': 'Person',
        name: post.authorName
      },
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      url: `https://watchtradingforums.com/blog/${post.slug}`,
      keywords: post.tags.join(', ')
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Watch Trading Blog | Expert Guides, Reviews & Industry Insights</title>
        <meta name="description" content="Discover expert watch trading guides, luxury watch reviews, market insights, and investment tips. Learn about Rolex, Patek Philippe, Audemars Piguet and more." />
        <meta name="keywords" content="watch trading, luxury watches, Rolex, Patek Philippe, watch investment, watch collecting, horology" />
        <link rel="canonical" href="https://watchtradingforums.com/blog" />
        <meta property="og:title" content="Watch Trading Blog | Expert Guides & Reviews" />
        <meta property="og:description" content="Expert watch trading guides, luxury watch reviews, and industry insights" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://watchtradingforums.com/blog" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('seo.blogTitle')}
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              {t('seo.siteDescription')}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder={t('forum.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Owner Actions */}
        {isOwner() && (
          <div className="mb-8 flex justify-end">
            <Link to="/blog/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </Button>
            </Link>
          </div>
        )}

        {/* Featured Post */}
        {!searchQuery && filteredPosts.length > 0 && (
          (() => {
            const displayPost = getDisplayPost(filteredPosts[0]);
            return (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('blog.latest')}</h2>
                <Link to={currentLanguage === 'en' ? `/blog/${filteredPosts[0].slug}` : `/blog/${currentLanguage}/${displayPost.slug}`}>
                  <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                    {filteredPosts[0].featuredImage && (
                      <div className="h-64 md:h-96 overflow-hidden">
                        <img 
                          src={filteredPosts[0].featuredImage} 
                          alt={displayPost.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {filteredPosts[0].tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                        {displayPost.title}
                      </h3>
                      <p className="text-gray-600 text-lg mb-6 line-clamp-3">
                        {displayPost.excerpt}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {filteredPosts[0].authorName}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(filteredPosts[0].publishedAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {estimateReadTime(displayPost.content)} {t('blog.minRead')}
                        </span>
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          {filteredPosts[0].viewCount.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            );
          })()
        )}

        {/* All Posts Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {searchQuery ? `Search Results (${filteredPosts.length})` : t('blog.latest')}
          </h2>
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">{t('forum.noThreads')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(searchQuery ? filteredPosts : filteredPosts.slice(1)).map((post) => {
                const displayPost = getDisplayPost(post);
                return (
                  <Link key={post.id} to={currentLanguage === 'en' ? `/blog/${post.slug}` : `/blog/${currentLanguage}/${displayPost.slug}`}>
                    <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                      {post.featuredImage ? (
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={post.featuredImage} 
                            alt={displayPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                          <span className="text-6xl">⌚</span>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
                          {displayPost.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                          {displayPost.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {estimateReadTime(displayPost.content)} {t('blog.minRead')}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* SEO Footer Content */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About Our Watch Trading Blog
            </h2>
            <p className="text-gray-600 mb-6">
              Welcome to the Watch Trading Forums Blog, your premier destination for expert watch trading advice, 
              luxury timepiece reviews, and horological insights. Our community of experienced collectors and 
              traders share their knowledge on Rolex, Patek Philippe, Audemars Piguet, and other prestigious brands. 
              Whether you're a seasoned trader or just starting your watch collecting journey, our guides cover 
              everything from authentication tips to market trends and investment strategies.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Watch Investment', 'Luxury Watches', 'Horology'].map((tag) => (
                <Badge key={tag} variant="outline" className="text-gray-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
