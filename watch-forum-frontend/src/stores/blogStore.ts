// ============================================
// BLOG STORE
// Posts are persisted in MongoDB via the backend API.
// Starts empty — no seed posts shown on load.
//
// setPostTranslations() saves translations to local store + backend.
// translatePost() processes all 15 languages one at a time and
// updates translationProgress[postId] after each language so the
// editor can display a live "Translating 3/15 — French…" counter.
// translatingIds prevents the same post from being translated twice.
// ============================================

import { create } from 'zustand';
import type { BlogPost } from '@/types';
import { api } from '@/lib/api';
import { translateSingleLanguage } from '@/services/translationService';
import { SUPPORTED_LANGUAGES } from '@/stores/languageStore';

export interface TranslationProgress {
  current: number;   // languages completed so far
  total: number;     // total languages to translate (14)
  language: string;  // human name of the language currently being translated
}

interface BlogState {
  posts: BlogPost[];
  isLoading: boolean;
  searchQuery: string;
  translatingIds: Set<string>;
  translationProgress: Record<string, TranslationProgress>;

  initialize: () => Promise<void>;

  createPost: (
    post: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt' | 'viewCount' | 'translations'>,
  ) => Promise<BlogPost>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  deletePostWithTranslations: (id: string) => Promise<void>;

  /** Save translations to local store and persist to backend */
  setPostTranslations: (id: string, translations: Record<string, any>) => void;

  getPostBySlug: (slug: string) => BlogPost | undefined;
  getPostById: (id: string) => BlogPost | undefined;
  getOriginalPostByAnySlug: (slug: string) => BlogPost | undefined;
  getAllPosts: () => BlogPost[];
  getPublishedPosts: () => BlogPost[];
  getRelatedPosts: (postId: string, limit?: number) => BlogPost[];
  setSearchQuery: (query: string) => void;

  getTranslatedPost: (post: BlogPost, lang: string) => BlogPost;

  /**
   * Translate a post into all supported languages, one at a time.
   * translationProgress[id] is updated after each language so callers
   * can await this promise and render a real-time progress bar.
   * Safe to call multiple times — ignored if already in progress.
   */
  translatePost: (id: string) => Promise<void>;

  incrementViews: (id: string) => void;
}

const generateSlug = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Languages excluding English
const TRANSLATION_LANGS = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');

export const useBlogStore = create<BlogState>()((set, get) => ({
  posts: [],
  isLoading: true,
  searchQuery: '',
  translatingIds: new Set<string>(),
  translationProgress: {},

  initialize: async () => {
    try {
      const data: BlogPost[] = await api.get('/blog');
      set({ posts: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createPost: async (postData) => {
    const postSlug = postData.slug || generateSlug(postData.title);
    const payload = { ...postData, slug: postSlug, viewCount: 0, translations: {} };
    const newPost: BlogPost = await api.post('/blog', payload);
    set(state => ({ posts: [newPost, ...state.posts] }));
    return newPost;
  },

  updatePost: async (id, updates) => {
    const updatedPost: BlogPost = await api.patch(`/blog/${id}`, updates);
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, ...updatedPost } : p)),
    }));
  },

  deletePost: async (id) => {
    await api.del(`/blog/${id}`);
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
  },

  deletePostWithTranslations: async (id) => {
    await api.del(`/blog/${id}`);
    set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
  },

  // ─── setPostTranslations ────────────────────────────────────────────────────
  setPostTranslations: (id, translations) => {
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, translations } : p)),
    }));
    api.patch(`/blog/${id}`, { translations }).catch(() => {});
  },

  // ─── translatePost ───────────────────────────────────────────────────────────
  translatePost: async (id) => {
    if (get().translatingIds.has(id)) return;

    const post = get().posts.find(p => p.id === id);
    if (!post) return;

    const total = TRANSLATION_LANGS.length;
    const baseSlug = post.slug;
    const metaTitle = post.metaTitle || post.title;
    const metaDescription = post.metaDescription || post.excerpt;

    // Mark as in-progress with starting progress
    set(state => ({
      translatingIds: new Set([...state.translatingIds, id]),
      translationProgress: {
        ...state.translationProgress,
        [id]: { current: 0, total, language: '' },
      },
    }));

    const translations: Record<string, any> = {};

    for (let i = 0; i < TRANSLATION_LANGS.length; i++) {
      const { code, name } = TRANSLATION_LANGS[i];

      // Update progress: show which language is being translated now
      set(state => ({
        translationProgress: {
          ...state.translationProgress,
          [id]: { current: i, total, language: name },
        },
      }));

      const result = await translateSingleLanguage(
        code,
        post.title,
        post.excerpt,
        post.content,
        metaTitle,
        metaDescription,
        baseSlug,
      );
      translations[code] = result;

      // Short pause between languages to respect MyMemory rate limits
      await new Promise(r => setTimeout(r, 250));
    }

    // Update local store → UI reacts (flags appear)
    set(state => ({
      posts: state.posts.map(p => (p.id === id ? { ...p, translations } : p)),
      translatingIds: new Set([...state.translatingIds].filter(tid => tid !== id)),
      translationProgress: Object.fromEntries(
        Object.entries(state.translationProgress).filter(([k]) => k !== id),
      ),
    }));

    // Persist to backend
    api.patch(`/blog/${id}`, { translations }).catch(() => {});
  },

  incrementViews: (id) => {
    api.post(`/blog/${id}/view`).catch(() => {});
    set(state => ({
      posts: state.posts.map(p =>
        p.id === id ? { ...p, viewCount: p.viewCount + 1 } : p,
      ),
    }));
  },

  // Search English slug first; if not found, search within all translations.
  // This lets /blog/fr/my-post-fr correctly load the French version.
  getPostBySlug: (slug) => {
    const direct = get().posts.find(p => p.slug === slug);
    if (direct) return direct;
    return get().posts.find(p =>
      p.translations &&
      Object.values(p.translations as Record<string, any>).some(t => t.slug === slug),
    );
  },

  getOriginalPostByAnySlug: (slug) =>
    get().posts.find(p => {
      if (p.slug === slug) return true;
      if (p.translations) {
        return Object.values(p.translations).some((t: any) => t.slug === slug);
      }
      return false;
    }),

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
