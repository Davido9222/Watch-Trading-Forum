// ============================================
// BLOG STORE
// SEO-optimized blog posts with multilingual support
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlogPost } from '@/types';
import { autoTranslateBlogPost, getTranslationUrls } from '@/services/translationService';

interface BlogState {
  posts: BlogPost[];
  searchQuery: string;

  // Actions
  createPost: (post: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt' | 'viewCount' | 'translations'>, autoTranslate?: boolean) => BlogPost;
  updatePost: (id: string, updates: Partial<BlogPost>, autoTranslate?: boolean) => void;
  deletePost: (id: string) => void;
  deletePostWithTranslations: (id: string) => void;
  getPostBySlug: (slug: string, lang?: string) => BlogPost | undefined;
  getPostById: (id: string, lang?: string) => BlogPost | undefined;
  getAllPosts: () => BlogPost[];
  getPublishedPosts: () => BlogPost[];
  incrementViews: (id: string) => void;
  getRelatedPosts: (postId: string, limit?: number) => BlogPost[];
  setSearchQuery: (query: string) => void;
  // Translation helpers
  getTranslatedPost: (post: BlogPost, lang: string) => BlogPost;
  generateTranslatedSlug: (baseSlug: string, lang: string) => string;
  // New functions for handling translated slugs
  getOriginalPostByAnySlug: (slug: string) => BlogPost | undefined;
  getPostIdByAnySlug: (slug: string) => string | undefined;
}

// ============================================
// SLUG GENERATOR
// ============================================
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// ============================================
// INITIAL BLOG POSTS - With auto-generated translations
// ============================================
const createInitialPosts = (): BlogPost[] => {
  const posts = [
    {
      id: 'blog-1',
      title: 'What Should Your First Watch Be?',
      slug: 'what-should-your-first-watch-be',
      excerpt: 'A comprehensive guide for newcomers to the watch collecting world. Learn which timepieces offer the best value for beginners and how to start your collection on the right foot.',
      content: `
        <h2>Starting Your Watch Journey</h2>
        <p>Choosing your first watch is an exciting milestone. Whether you're drawn to the craftsmanship of mechanical movements or the precision of quartz, there's a perfect timepiece waiting for you.</p>
        
        <h3>Consider Your Budget</h3>
        <p>Before diving into the vast world of watches, establish a realistic budget. Entry-level mechanical watches from brands like Seiko, Orient, and Citizen offer exceptional value between $200-$500.</p>
        
        <h3>Understand Watch Movements</h3>
        <p>There are three main types of watch movements:</p>
        <ul>
          <li><strong>Mechanical:</strong> Powered by a mainspring, no battery needed</li>
          <li><strong>Automatic:</strong> Self-winding mechanical movement</li>
          <li><strong>Quartz:</strong> Battery-powered, highly accurate</li>
        </ul>
        
        <h3>Style Matters</h3>
        <p>Consider your lifestyle and wardrobe. A versatile dress watch works for formal occasions, while a sports watch handles daily wear and outdoor activities.</p>
        
        <h2>Our Top Recommendations</h2>
        <p>For beginners, we recommend starting with brands like Seiko 5, Orient Bambino, or the Timex Weekender. These offer excellent build quality and heritage at accessible prices.</p>
      `,
      authorId: 'owner-1',
      authorName: 'SiteOwner',
      authorAvatar: '/avatar-owner.png',
      featuredImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200',
      tags: ['Beginner Guide', 'Watch Collecting', 'First Watch', 'Buying Guide'],
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 1250,
    },
    {
      id: 'blog-2',
      title: 'Understanding Rolex Reference Numbers',
      slug: 'understanding-rolex-reference-numbers',
      excerpt: 'Decode the mysterious world of Rolex reference numbers. Learn what those digits mean and how to identify different models, generations, and variations.',
      content: `
        <h2>The Rolex Numbering System</h2>
        <p>Rolex uses a sophisticated reference number system that encodes information about each watch model. Understanding these numbers is essential for any serious collector.</p>
        
        <h3>5-Digit vs 6-Digit References</h3>
        <p>Older Rolex models use 5-digit references, while modern models use 6 digits. The extra digit typically indicates a new generation with updated features.</p>
        
        <h3>Decoding the Numbers</h3>
        <p>The first 2-3 digits indicate the model family:</p>
        <ul>
          <li>11xxx - Oyster Perpetual</li>
          <li>12xxx - Datejust</li>
          <li>16xxx - Datejust 36mm</li>
          <li>116xxx - Daytona</li>
          <li>126xxx - Submariner</li>
        </ul>
        
        <h2>Material Codes</h2>
        <p>The last digit often indicates the material:</p>
        <ul>
          <li>0 - Steel</li>
          <li>1 - Everose gold & steel</li>
          <li>3 - Yellow gold & steel</li>
          <li>4 - White gold & steel</li>
          <li>6 - Platinum</li>
          <li>8 - Yellow gold</li>
          <li>9 - White gold</li>
        </ul>
      `,
      authorId: 'owner-1',
      authorName: 'SiteOwner',
      authorAvatar: '/avatar-owner.png',
      featuredImage: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=1200',
      tags: ['Rolex', 'Reference Numbers', 'Education', 'Luxury Watches'],
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      viewCount: 892,
    },
    {
      id: 'blog-3',
      title: 'Investment Watches: What Holds Value?',
      slug: 'investment-watches-what-holds-value',
      excerpt: 'Discover which watches make smart investments and which ones to avoid. Learn about depreciation, appreciation, and the factors that affect a watch\'s resale value.',
      content: `
        <h2>Watches as Investments</h2>
        <p>While most watches depreciate like cars, certain models from prestigious brands can actually appreciate over time. Understanding what drives value is crucial for collectors.</p>
        
        <h3>Brands That Hold Value</h3>
        <p>Certain brands consistently perform well in the secondary market:</p>
        <ul>
          <li><strong>Rolex:</strong> The gold standard for value retention</li>
          <li><strong>Patek Philippe:</strong> Exceptional long-term appreciation</li>
          <li><strong>Audemars Piguet:</strong> Royal Oak models perform strongly</li>
          <li><strong>Vacheron Constantin:</strong> Undervalued with growth potential</li>
        </ul>
        
        <h3>Factors Affecting Value</h3>
        <p>Several factors determine a watch's investment potential:</p>
        <ul>
          <li>Brand heritage and reputation</li>
          <li>Limited production numbers</li>
          <li>Condition and completeness (box, papers)</li>
          <li>Market demand and trends</li>
          <li>Historical significance</li>
        </ul>
        
        <h2>Buy What You Love</h2>
        <p>While investment potential is important, remember to buy watches you genuinely enjoy. The best investment is one you'll wear and appreciate for years to come.</p>
      `,
      authorId: 'owner-1',
      authorName: 'SiteOwner',
      authorAvatar: '/avatar-owner.png',
      featuredImage: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200',
      tags: ['Investment', 'Value Retention', 'Buying Guide', 'Market Analysis'],
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      viewCount: 2103,
    },
  ];
  
  // Add translations to each post
  return posts.map(post => ({
    ...post,
    translations: autoTranslateBlogPost(
      post.title,
      post.excerpt,
      post.content,
      post.title,
      post.excerpt,
      post.slug
    ),
  }));
};

// ============================================
// BLOG STORE
// ============================================
export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      posts: createInitialPosts(),
      searchQuery: '',

      // ============================================
      // CREATE POST - Auto-generates translations for SEO
      // ============================================
      createPost: (postData, autoTranslate = true) => {
        const postSlug = postData.slug || generateSlug(postData.title);
        
        // Auto-generate translations if enabled
        const translations = autoTranslate 
          ? autoTranslateBlogPost(
              postData.title,
              postData.excerpt,
              postData.content,
              postData.metaTitle,
              postData.metaDescription,
              postSlug
            )
          : {};
        
        const newPost: BlogPost = {
          ...postData,
          id: `blog-${Date.now()}`,
          slug: postSlug,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          translations,
        };
        set(state => ({ posts: [newPost, ...state.posts] }));
        return newPost;
      },

      // ============================================
      // UPDATE POST - Auto-regenerates translations when English changes
      // ============================================
      updatePost: (id, updates, autoTranslate = true) => {
        set(state => ({
          posts: state.posts.map(post => {
            if (post.id !== id) return post;
            
            // Auto-regenerate translations if English content changed
            let translations = post.translations || {};
            if (autoTranslate && (
              updates.title || 
              updates.excerpt || 
              updates.content || 
              updates.metaTitle || 
              updates.metaDescription
            )) {
              translations = autoTranslateBlogPost(
                updates.title || post.title,
                updates.excerpt || post.excerpt,
                updates.content || post.content,
                updates.metaTitle || post.metaTitle,
                updates.metaDescription || post.metaDescription
              );
            }
            
            return { 
              ...post, 
              ...updates, 
              updatedAt: new Date().toISOString(),
              translations
            };
          }),
        }));
      },

      // ============================================
      // DELETE POST
      // ============================================
      deletePost: (id) => {
        set(state => ({
          posts: state.posts.filter(post => post.id !== id),
        }));
      },

      // ============================================
      // DELETE POST WITH ALL TRANSLATIONS
      // This deletes the main post and all its translations
      // ============================================
      deletePostWithTranslations: (id) => {
        // Just delete the main post - translations are stored within it
        set(state => ({
          posts: state.posts.filter(post => post.id !== id),
        }));
      },

      // ============================================
      // GET TRANSLATION URLS FOR A POST
      // Returns all language URLs for SEO
      // ============================================
      getTranslationUrls: (postId: string) => {
        const post = get().posts.find(p => p.id === postId);
        if (!post) return [];
        return getTranslationUrls(post.slug, post.translations || {});
      },

      // ============================================
      // GET POST BY SLUG - Returns English version for blog list
      // ============================================
      getPostBySlug: (slug, lang = 'en') => {
        const post = get().posts.find(post => {
          // Check English slug
          if (post.slug === slug) return true;
          // Check translated slugs
          if (post.translations) {
            return Object.values(post.translations).some(t => t.slug === slug);
          }
          return false;
        });

        if (!post) return undefined;

        // Return translated version if language is not English
        if (lang !== 'en' && post.translations?.[lang]) {
          return get().getTranslatedPost(post, lang);
        }

        return post;
      },

      // ============================================
      // GET ORIGINAL POST BY ANY SLUG
      // Finds the original English post from any translated slug
      // Used for edit page to handle translated URLs
      // ============================================
      getOriginalPostByAnySlug: (slug: string) => {
        return get().posts.find(post => {
          // Check English slug
          if (post.slug === slug) return true;
          // Check translated slugs
          if (post.translations) {
            return Object.values(post.translations).some(t => t.slug === slug);
          }
          return false;
        });
      },

      // ============================================
      // GET POST ID BY ANY SLUG
      // Returns the post ID for any slug (English or translated)
      // ============================================
      getPostIdByAnySlug: (slug: string) => {
        const post = get().posts.find(post => {
          if (post.slug === slug) return true;
          if (post.translations) {
            return Object.values(post.translations).some(t => t.slug === slug);
          }
          return false;
        });
        return post?.id;
      },

      // ============================================
      // GET POST BY ID - With optional translation
      // ============================================
      getPostById: (id, lang = 'en') => {
        const post = get().posts.find(post => post.id === id);
        
        if (!post) return undefined;
        
        // Return translated version if language is not English
        if (lang !== 'en' && post.translations?.[lang]) {
          return get().getTranslatedPost(post, lang);
        }
        
        return post;
      },

      // ============================================
      // GET ALL POSTS - Always returns English (for blog list)
      // ============================================
      getAllPosts: () => {
        return get().posts;
      },

      // ============================================
      // GET PUBLISHED POSTS - Always returns English (for blog list)
      // ============================================
      getPublishedPosts: () => {
        return get().posts.filter(post => new Date(post.publishedAt) <= new Date());
      },

      // ============================================
      // INCREMENT VIEW COUNT
      // ============================================
      incrementViews: (id) => {
        set(state => ({
          posts: state.posts.map(post =>
            post.id === id ? { ...post, viewCount: post.viewCount + 1 } : post
          ),
        }));
      },

      // ============================================
      // GET RELATED POSTS
      // ============================================
      getRelatedPosts: (postId, limit = 3) => {
        const currentPost = get().getPostById(postId);
        if (!currentPost) return [];
        
        return get().posts
          .filter(post => post.id !== postId)
          .filter(post => post.tags.some(tag => currentPost.tags.includes(tag)))
          .slice(0, limit);
      },

      // ============================================
      // SET SEARCH QUERY
      // ============================================
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // ============================================
      // GET TRANSLATED POST - Returns post with translated content
      // ============================================
      getTranslatedPost: (post, lang) => {
        const translation = post.translations?.[lang];
        if (!translation) return post;
        
        return {
          ...post,
          title: translation.title,
          slug: translation.slug,
          excerpt: translation.excerpt,
          content: translation.content,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
        };
      },

      // ============================================
      // GENERATE TRANSLATED SLUG
      // ============================================
      generateTranslatedSlug: (baseSlug, lang) => {
        return `${baseSlug}-${lang}`;
      },

    }),
    {
      name: 'watch-forum-blog',
      version: 3, // Version bump for full translations
      migrate: (persistedState: any, version) => {
        if (version < 3) {
          // Generate translations for existing posts
          return {
            ...persistedState,
            posts: persistedState.posts.map((post: BlogPost) => ({
              ...post,
              translations: post.translations && Object.keys(post.translations).length > 0 
                ? post.translations 
                : autoTranslateBlogPost(post.title, post.excerpt, post.content, post.metaTitle, post.metaDescription, post.slug),
            })),
          };
        }
        return persistedState;
      },
    }
  )
);
