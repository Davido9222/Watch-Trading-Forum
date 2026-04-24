// ============================================
// NOTIFICATION STORE — server-backed
// Notifications are persisted in MongoDB so the
// thread author sees the bell update on ANY device.
// Polls /api/notifications every 15s while the user
// is on the site.
// ============================================

import { create } from 'zustand';
import type { Notification } from '@/types';
import { api, getToken } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  initialized: boolean;
  loading: boolean;

  // Polling helpers
  init: (userId: string) => void;
  stop: () => void;
  refresh: () => Promise<void>;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;

  // Mute thread (persisted server-side on the user document)
  muteThread: (userId: string, threadId: string) => Promise<void>;
  unmuteThread: (userId: string, threadId: string) => Promise<void>;
  isThreadMuted: (userId: string, threadId: string) => boolean;

  // Legacy no-op helpers (notifications are now created on the backend)
  notifyThreadReply: (
    threadId: string,
    threadTitle: string,
    threadAuthorId: string,
    replyAuthorName: string
  ) => void;
  notifyProfileComment: (
    profileUserId: string,
    commentAuthorName: string,
    commentId: string
  ) => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_MS = 15000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  initialized: false,
  loading: false,

  init: (_userId) => {
    if (get().initialized) return;
    set({ initialized: true });
    get().refresh().catch(() => {});
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!getToken()) return; // skip when logged out
      get().refresh().catch(() => {});
    }, POLL_MS);
  },

  stop: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    set({ initialized: false, notifications: [] });
  },

  refresh: async () => {
    if (!getToken()) return;
    if (get().loading) return;
    set({ loading: true });
    try {
      const data = await api.get('/notifications');
      set({ notifications: data.notifications || [] });
    } catch {
      // ignore — likely 401 (logged out)
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }));
    try {
      await api.post(`/notifications/${notificationId}/read`);
    } catch {
      /* ignore */
    }
  },

  markAllAsRead: async (userId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === userId ? { ...n, isRead: true } : n
      ),
    }));
    try {
      await api.post('/notifications/read-all');
    } catch {
      /* ignore */
    }
  },

  deleteNotification: async (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    }));
    try {
      await api.del(`/notifications/${notificationId}`);
    } catch {
      /* ignore */
    }
  },

  getUserNotifications: (userId) => {
    // Trigger init lazily if the bell renders before App did so.
    if (!get().initialized && getToken()) {
      get().init(userId);
    }
    return get()
      .notifications.filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  getUnreadCount: (userId) =>
    get().notifications.filter((n) => n.userId === userId && !n.isRead).length,

  // Mute / unmute — persists to backend so the server can skip notifying.
  muteThread: async (_userId, threadId) => {
    try {
      await api.post(`/users/me/mute-thread/${threadId}`);
    } catch {
      /* ignore */
    }
  },

  unmuteThread: async (_userId, threadId) => {
    try {
      await api.del(`/users/me/mute-thread/${threadId}`);
    } catch {
      /* ignore */
    }
  },

  isThreadMuted: (userId, threadId) => {
    // Look up muted threads on the current user record (kept in authStore).
    try {
      // Lazy import to avoid a circular dependency at module load.
      const { useAuthStore } =
        require('./authStore') as typeof import('./authStore');
      const u = useAuthStore.getState().getUserById(userId);
      return !!u?.mutedThreads?.some((m: any) => m && m.threadId === threadId);
    } catch {
      return false;
    }
  },

  // Legacy helpers — kept so existing call sites (e.g. ThreadPage) compile.
  // They are no-ops because the server now creates the notification.
  notifyThreadReply: () => undefined,
  notifyProfileComment: () => undefined,
}));
