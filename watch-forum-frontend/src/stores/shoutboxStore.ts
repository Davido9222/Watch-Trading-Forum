// ============================================
// SHOUTBOX STORE — server-backed (global chat)
// Messages are stored in MongoDB so EVERY logged-in
// user sees the same conversation. Polls /api/shouts
// every 4s while the page is open.
// ============================================

import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/lib/api';

export interface ShoutboxMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: 'user' | 'admin' | 'owner';
  timestamp: string;
}

interface ShoutboxState {
  messages: ShoutboxMessage[];
  initialized: boolean;
  loading: boolean;
  lastMessageTime: number;
  messageCountInWindow: number;
  windowStartTime: number;

  // Polling lifecycle
  init: () => void;
  stop: () => void;
  refresh: () => Promise<void>;

  // Actions
  sendMessage: (content: string, user: User) => Promise<{ success: boolean; error?: string }>;
  getMessages: () => ShoutboxMessage[];
  clearMessages: () => Promise<void>;
  canSendMessage: () => { allowed: boolean; remaining: number; secondsUntilReset: number };
}

const MAX_PER_WINDOW = 10;
const WINDOW_DURATION_MS = 15000;
const POLL_MS = 4000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useShoutboxStore = create<ShoutboxState>((set, get) => ({
  messages: [],
  initialized: false,
  loading: false,
  lastMessageTime: 0,
  messageCountInWindow: 0,
  windowStartTime: 0,

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });
    get().refresh().catch(() => {});
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      get().refresh().catch(() => {});
    }, POLL_MS);
  },

  stop: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    set({ initialized: false });
  },

  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await api.get('/shouts');
      set({ messages: data.messages || [] });
    } catch {
      /* ignore */
    } finally {
      set({ loading: false });
    }
  },

  canSendMessage: () => {
    const now = Date.now();
    const { windowStartTime, messageCountInWindow } = get();
    if (now - windowStartTime > WINDOW_DURATION_MS) {
      return { allowed: true, remaining: MAX_PER_WINDOW, secondsUntilReset: 0 };
    }
    const remaining = MAX_PER_WINDOW - messageCountInWindow;
    const secondsUntilReset = Math.ceil((WINDOW_DURATION_MS - (now - windowStartTime)) / 1000);
    return { allowed: remaining > 0, remaining: Math.max(0, remaining), secondsUntilReset };
  },

  sendMessage: async (content, _user) => {
    const trimmed = content.trim();
    if (!trimmed) return { success: false, error: 'Message cannot be empty' };
    if (trimmed.length > 500) return { success: false, error: 'Message too long (max 500 characters)' };

    const rateLimit = get().canSendMessage();
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Please wait ${rateLimit.secondsUntilReset}s.`,
      };
    }

    try {
      const data = await api.post('/shouts', { content: trimmed });
      // Update local rate-limit window
      const now = Date.now();
      const { windowStartTime, messageCountInWindow } = get();
      const inSameWindow = now - windowStartTime <= WINDOW_DURATION_MS;
      set({
        messages: [...get().messages, data.shout],
        lastMessageTime: now,
        windowStartTime: inSameWindow ? windowStartTime : now,
        messageCountInWindow: inSameWindow ? messageCountInWindow + 1 : 1,
      });
      // Pull a fresh copy so we get any other messages posted concurrently.
      get().refresh().catch(() => {});
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send message' };
    }
  },

  getMessages: () => {
    if (!get().initialized) get().init();
    return get().messages;
  },

  clearMessages: async () => {
    try {
      await api.del('/shouts');
      set({ messages: [] });
    } catch {
      /* ignore */
    }
  },
}));

export default useShoutboxStore;
