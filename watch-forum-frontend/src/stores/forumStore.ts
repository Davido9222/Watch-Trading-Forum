import { create } from 'zustand';
import type { ForumSection, Thread, Comment, SortOption, TimeFilter } from '@/types';
import { createInitialSections } from '@/data/forumSections';
import { api } from '@/lib/api';

interface ForumState {
  sections: ForumSection[];
  threads: Thread[];
  comments: Comment[];
  lastThreadTimes: Record<string, string>;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  getSectionById: (id: string) => ForumSection | undefined;
  getSectionBySlug: (slug: string) => ForumSection | undefined;
  getSubsections: (parentId: string) => ForumSection[];
  getMainSections: () => ForumSection[];
  getAllDescendantSectionIds: (sectionId: string) => string[];
  getAllAncestorSectionIds: (sectionId: string) => string[];
  getAggregatedThreadCount: (sectionId: string) => number;
  getAggregatedPostCount: (sectionId: string) => number;
  getThreadsBySectionWithDescendants: (sectionId: string, sort?: SortOption, timeFilter?: TimeFilter) => Thread[];
  createThread: (thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'commentCount'>) => Promise<Thread>;
  getThreadById: (id: string) => Thread | undefined;
  getThreadsBySection: (sectionId: string, sort?: SortOption, timeFilter?: TimeFilter) => Thread[];
  canCreateThread: (userId: string) => { allowed: boolean; timeRemaining?: number };
  getLastThreadTime: (userId: string) => string | null;
  pinThread: (threadId: string) => Promise<void>;
  unpinThread: (threadId: string) => Promise<void>;
  searchThreads: (query: string, sectionId?: string) => Thread[];
  incrementViewCount: (threadId: string) => Promise<void>;
  lockThread: (threadId: string) => Promise<void>;
  unlockThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  createComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'upvotes' | 'downvotes'>) => Promise<Comment>;
  getCommentsByThread: (threadId: string) => Comment[];
  getCommentsByUser: (userId: string) => Comment[];
  deleteComment: (commentId: string) => void;
  // Now async — hits backend so karma is updated server-side and stays in sync
  voteComment: (commentId: string, userId: string, vote: 'up' | 'down') => Promise<{ karmaChange: number; authorId: string | null; authorKarma?: number }>;
  removeVote: (commentId: string, userId: string) => void;
  getUserVote: (commentId: string, userId: string) => 'up' | 'down' | null;
  getUserActivity: (userId: string) => { threads: Thread[]; comments: Comment[] };
}

function applyFilterSort(threads: Thread[], sort: SortOption = 'newest', timeFilter: TimeFilter = 'all') {
  let filtered = [...threads];
  if (timeFilter !== 'all') {
    const now = Date.now();
    const filterMs = { '3months': 90*24*60*60*1000, month: 30*24*60*60*1000, week: 7*24*60*60*1000 }[timeFilter] || 0;
    filtered = filtered.filter(t => now - new Date(t.createdAt).getTime() <= filterMs);
  }
  if (sort === 'newest') filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === 'hot') filtered.sort((a,b) => (b.viewCount + b.commentCount*10) - (a.viewCount + a.commentCount*10));
  filtered.sort((a,b) => Number(b.isPinned) - Number(a.isPinned));
  return filtered;
}

export const useForumStore = create<ForumState>((set, get) => ({
  sections: createInitialSections(),
  threads: [],
  comments: [],
  lastThreadTimes: {},
  isInitialized: false,
  initialize: async () => {
    if (get().isInitialized) return;
    const data = await api.get('/threads');
    set({ threads: data.threads || [], isInitialized: true });
  },
  loadThread: async (threadId) => {
    const data = await api.get(`/threads/${threadId}`);
    set(state => ({
      threads: state.threads.some(t => t.id === data.thread.id) ? state.threads.map(t => t.id === data.thread.id ? data.thread : t) : [data.thread, ...state.threads],
      comments: [...state.comments.filter(c => c.threadId !== threadId), ...(data.comments || [])],
    }));
  },
  getSectionById: (id) => get().sections.find(s => s.id === id),
  getSectionBySlug: (slug) => get().sections.find(s => s.slug === slug),
  getSubsections: (parentId) => get().sections.filter(s => s.parentId === parentId).sort((a,b)=>a.order-b.order),
  getMainSections: () => get().sections.filter(s => !s.parentId).sort((a,b)=>a.order-b.order),
  getAllDescendantSectionIds: (sectionId) => {
    const ids: string[] = [];
    const collect = (parentId: string) => {
      get().sections.filter(s => s.parentId === parentId).forEach(child => { ids.push(child.id); collect(child.id); });
    };
    collect(sectionId);
    return ids;
  },
  getAllAncestorSectionIds: (sectionId) => {
    const ids: string[] = [];
    let current = get().sections.find(s => s.id === sectionId);
    while (current?.parentId) {
      ids.push(current.parentId);
      current = get().sections.find(s => s.id === current?.parentId);
    }
    return ids;
  },
  getAggregatedThreadCount: (sectionId) => {
    const all = [sectionId, ...get().getAllDescendantSectionIds(sectionId)];
    return get().threads.filter(t => all.includes(t.sectionId)).length;
  },
  getAggregatedPostCount: (sectionId) => {
    const all = [sectionId, ...get().getAllDescendantSectionIds(sectionId)];
    const sectionThreads = get().threads.filter(t => all.includes(t.sectionId));
    const threadIds = sectionThreads.map(t => t.id);
    return sectionThreads.length + get().comments.filter(c => threadIds.includes(c.threadId)).length;
  },
  getThreadsBySectionWithDescendants: (sectionId, sort='newest', timeFilter='all') => {
    const all = [sectionId, ...get().getAllDescendantSectionIds(sectionId)];
    return applyFilterSort(get().threads.filter(t => all.includes(t.sectionId)), sort, timeFilter);
  },
  createThread: async (thread) => {
    const data = await api.post('/threads', thread);
    const newThread = data.thread as Thread;
    set(state => ({ threads: [newThread, ...state.threads], lastThreadTimes: { ...state.lastThreadTimes, [thread.authorId]: newThread.createdAt } }));
    return newThread;
  },
  getThreadById: (id) => get().threads.find(t => t.id === id),
  getThreadsBySection: (sectionId, sort='newest', timeFilter='all') => applyFilterSort(get().threads.filter(t => t.sectionId === sectionId), sort, timeFilter),
  canCreateThread: (userId) => {
    const last = get().lastThreadTimes[userId];
    if (!last) return { allowed: true };
    // 1 thread per minute (matches the new server-side rate limit)
    const rem = 60 * 1000 - (Date.now() - new Date(last).getTime());
    return rem <= 0 ? { allowed: true } : { allowed: false, timeRemaining: rem };
  },
  getLastThreadTime: (userId) => get().lastThreadTimes[userId] || null,
  pinThread: async (threadId) => { const data = await api.patch(`/threads/${threadId}`, { isPinned: true }); set(state => ({ threads: state.threads.map(t => t.id===threadId?data.thread:t) })); },
  unpinThread: async (threadId) => { const data = await api.patch(`/threads/${threadId}`, { isPinned: false }); set(state => ({ threads: state.threads.map(t => t.id===threadId?data.thread:t) })); },
  searchThreads: (query, sectionId) => {
    const q = query.toLowerCase();
    return get().threads.filter(t => (!sectionId || t.sectionId===sectionId) && t.title.toLowerCase().includes(q)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  },
  incrementViewCount: async (threadId) => {
    set(state => ({ threads: state.threads.map(t => t.id===threadId ? { ...t, viewCount: t.viewCount + 1 } : t) }));
    try { await api.post(`/threads/${threadId}/view`); } catch {}
  },
  lockThread: async (threadId) => { const data = await api.patch(`/threads/${threadId}`, { isLocked: true }); set(state => ({ threads: state.threads.map(t => t.id===threadId?data.thread:t) })); },
  unlockThread: async (threadId) => { const data = await api.patch(`/threads/${threadId}`, { isLocked: false }); set(state => ({ threads: state.threads.map(t => t.id===threadId?data.thread:t) })); },
  deleteThread: async (threadId) => { await api.del(`/threads/${threadId}`); set(state => ({ threads: state.threads.filter(t => t.id !== threadId), comments: state.comments.filter(c => c.threadId !== threadId) })); },
  createComment: async (comment) => {
    const data = await api.post(`/threads/${comment.threadId}/comments`, comment);
    const newComment = data.comment as Comment;
    set(state => ({ comments: [...state.comments.filter(c => c.id !== newComment.id), newComment], threads: state.threads.map(t => t.id===comment.threadId ? { ...t, commentCount: t.commentCount+1, lastCommentAt: newComment.createdAt, lastCommentBy: newComment.authorName } : t) }));
    return newComment;
  },
  getCommentsByThread: (threadId) => get().comments.filter(c => c.threadId === threadId).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()),
  getCommentsByUser: (userId) => get().comments.filter(c => c.authorId === userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),
  deleteComment: (commentId) => set(state => ({ comments: state.comments.filter(c => c.id !== commentId) })),
  voteComment: async (commentId, _userId, vote) => {
    try {
      const data = await api.post(`/threads/comments/${commentId}/vote`, { vote });
      const updated = data.comment as Comment;
      set(state => ({
        comments: state.comments.map(c => c.id === updated.id ? updated : c),
      }));
      return {
        karmaChange: data.karmaChange || 0,
        authorId: data.authorId || null,
        authorKarma: data.authorKarma,
      };
    } catch {
      return { karmaChange: 0, authorId: null };
    }
  },
  removeVote: (commentId, userId) => set(state => ({ comments: state.comments.map(c => c.id!==commentId ? c : { ...c, votes: c.votes.filter(v => v.userId !== userId) }) })),
  getUserVote: (commentId, userId) => get().comments.find(c => c.id===commentId)?.votes.find(v => v.userId===userId)?.vote || null,
  getUserActivity: (userId) => ({ threads: get().threads.filter(t => t.authorId===userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()), comments: get().comments.filter(c => c.authorId===userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()) }),
}));
