// ============================================
// BLOG STORE
// Posts are persisted in MongoDB via the backend API.
// The frontend store starts EMPTY and fills from the API on
// initialize() — no hardcoded seed posts are shown to users.
// ============================================

import { create } from 'zustand';
import type { BlogPost } from '@/types';
import { api } from '@/lib/api';
import { autoTranslateBlogPostAsync } from '@/services/translationService';

interface BlogState {
  posts: BlogPost[];
  isLoading: boolean;
  searchQuery: string;

  // Lifecycle
  initialize: () => Promise<void>;

  // CRUD — all async so callers can await and handle errors
  createPost: (
    post: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt' | 'viewCount' | 'translations'>,
  ) => Promise<BlogPost>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  deletePostWithTranslations: (id: string) => Promise<void>;

  // Queries
  getPostBySlug: (slug: string, lang?: string) => BlogPost | undefined;
  getPostById: (id: string) => BlogPost | undefined;
  getOriginalPostByAnySlug: (slug: string) => BlogPost | undefined;
  getPostIdByAnySlug: (slug: string) => string | undefined;
  getAllPosts: () => BlogPost[];
  getPublishedPosts: () => BlogPost[];
  getRelatedPosts: (postId: string, limit?: number) => BlogPost[];
  setSearchQuery: (query: string) => void;

  // Translation helpers
  getTranslatedPost: (post: BlogPost, lang: string) => BlogPost;

  // Async translation — call fire-and-forget after createPost/updatePost.
  // Saves completed translations back to the backend automatically.
  translatePost: (id: string) => Promise<void>;

  // View counter (fire-and-forget)
  incrementViews: (id: string) => void;
}

const generateSlug = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const useBlogStore = create<BlogState>()((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  posts: [],       // Always empty on first render — filled by initialize()
  isLoading: true,
  searchQuery: '',

  // ─── initialize ─────────────────────────────────────────────────────────────
  // Called once in App.tsx on mount. Fetches all posts from the backend.
  initialize: async () => {
    try {
      const data: BlogPost[] = await api.get('/blog');
      set({ posts: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // ─── createPost ─────────────────────────────────────────────────────────────
  // Saves the post to the backend. Returns the saved document (with id).
  // Translation is NOT awaited here — call translatePost() fire-and-forget
  // after this resolves so the user can navigate immediately.
  createPost: async (postData) => {
    const postSlug = postData.slug || generateSlug(postData.title);
    const payload = { ...postData, slug: postSlug, viewCount: 0, translations: {} };
    const newPost: BlogPost = await api.post('/blog', payload);
    set(state => ({ posts: [newPost, ...state.posts] }));
    return newPost;
  },

  // ─── updatePost ─────────────────────────────────────────────────────────────
  updatePost: async (id, updates) => {
    const updatedPost: BlogPost = await api.patch(`/blog/${id}`, updates);
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, ...updatedPost } : p)),
    }));
  },

  // ─── deletePost ─────────────────────────────────────────────────────────────
  deletePost: async (id) => {
    await api.del(`/blog/${id}`);
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
  },

  deletePostWithTranslations: async (id) => {
    await api.del(`/blog/${id}`);
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
  },

  // ─── translatePost ───────────────────────────────────────────────────────────
  // Translates the full post into all supported languages using MyMemory.
  // Languages are processed sequentially inside autoTranslateBlogPostAsync.
  // When complete, translations are patched to the backend and the local
  // store is updated — causing BlogPostPage to reactively show the flags.
  translatePost: async (id) => {
    const post = get().posts.find(p => p.id === id);
    if (!post) return;
    try {
      const translations = await autoTranslateBlogPostAsync(
        post.title,
        post.excerpt,
        post.content,
        post.metaTitle,
        post.metaDescription,
        post.slug,
      );
      // Update local state immediately so UI reacts
      set(state => ({
        posts: state.posts.map(p => (p.id === id ? { ...p, translations } : p)),
      }));
      // Persist translations to backend (don't block on failure)
      api.patch(`/blog/${id}`, { translations }).catch(() => {});
    } catch {
      // Silent failure — post remains without translations
    }
  },

  // ─── incrementViews ──────────────────────────────────────────────────────────
  incrementViews: (id) => {
    api.post(`/blog/${id}/view`).catch(() => {});
    set(state => ({
      posts: state.posts.map(p =>
        p.id === id ? { ...p, viewCount: p.viewCount + 1 } : p,
      ),
    }));
  },

  // ─── Queries ─────────────────────────────────────────────────────────────────
  getPostBySlug: (slug) =>
    get().posts.find(p => p.slug === slug),

  getOriginalPostByAnySlug: (slug) =>
    get().posts.find(p => {
      if (p.slug === slug) return true;
      if (p.translations) {
        return Object.values(p.translations).some((t: any) => t.slug === slug);
      }
      return false;
    }),

  getPostIdByAnySlug: (slug) =>
    get().getOriginalPostByAnySlug(slug)?.id,

  getPostById: (id) => get().posts.find(p => p.id === id),

  getAllPosts: () => get().posts,

  getPublishedPosts: () =>
    get().posts.filter(p => new Date(p.publishedAt) <= new Date()),

  getRelatedPosts: (postId, limit = 3) => {
    const current = get().posts.find(p => p.id === postId);
    if (!current) return [];
    return get()
      .posts.filter(p => p.id !== postId && p.tags.some(t => current.tags.includes(t)))
      .slice(0, limit);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  // ─── getTranslatedPost ───────────────────────────────────────────────────────
  // Returns a copy of the post with translated fields substituted in.
  // Falls back to English if no translation exists yet.
  getTranslatedPost: (post, lang) => {
    if (lang === 'en') return post;
    const t = post.translations?.[lang];
    if (!t) return post;
    return {
      ...post,
      title: t.title || post.title,
      slug: t.slug || post.slug,
      excerpt: t.excerpt || post.excerpt,
      content: t.content || post.content,
      metaTitle: t.metaTitle || post.metaTitle,
      metaDescription: t.metaDescription || post.metaDescription,
    };
  },
}));
