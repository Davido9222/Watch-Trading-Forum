// ============================================
// NOTIFICATION STORE
// Handles user notifications for thread replies and profile comments
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  
  // Actions
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Notification;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  deleteNotification: (notificationId: string) => void;
  getUserNotifications: (userId: string) => Notification[];
  getUnreadCount: (userId: string) => number;
  
  // Mute thread actions
  muteThread: (userId: string, threadId: string) => void;
  unmuteThread: (userId: string, threadId: string) => void;
  isThreadMuted: (userId: string, threadId: string) => boolean;
  
  // Notification creation helpers
  notifyThreadReply: (threadId: string, threadTitle: string, threadAuthorId: string, replyAuthorName: string) => void;
  notifyProfileComment: (profileUserId: string, commentAuthorName: string, commentId: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      // ============================================
      // CREATE NOTIFICATION
      // ============================================
      createNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        
        set(state => ({
          notifications: [newNotification, ...state.notifications],
        }));
        
        return newNotification;
      },

      // ============================================
      // MARK NOTIFICATION AS READ
      // ============================================
      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      // ============================================
      // MARK ALL NOTIFICATIONS AS READ
      // ============================================
      markAllAsRead: (userId) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.userId === userId ? { ...n, read: true } : n
          ),
        }));
      },

      // ============================================
      // DELETE NOTIFICATION
      // ============================================
      deleteNotification: (notificationId) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== notificationId),
        }));
      },

      // ============================================
      // GET USER NOTIFICATIONS
      // ============================================
      getUserNotifications: (userId) => {
        return get().notifications
          .filter(n => n.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      // ============================================
      // GET UNREAD NOTIFICATION COUNT
      // ============================================
      getUnreadCount: (userId) => {
        return get().notifications.filter(n => n.userId === userId && !n.isRead).length;
      },

      // ============================================
      // MUTE THREAD - Stop notifications for this thread
      // ============================================
      muteThread: (userId, threadId) => {
        // This is handled in authStore since mutedThreads is stored per user
        const { users, setUsers } = useAuthStore.getState();
        const updatedUsers = users.map(u => {
          if (u.id !== userId) return u;
          const alreadyMuted = u.mutedThreads?.some(mt => mt.threadId === threadId);
          if (alreadyMuted) return u;
          return {
            ...u,
            mutedThreads: [...(u.mutedThreads || []), { threadId, mutedAt: new Date().toISOString() }],
          };
        });
        setUsers(updatedUsers);
      },

      // ============================================
      // UNMUTE THREAD - Resume notifications for this thread
      // ============================================
      unmuteThread: (userId, threadId) => {
        const { users, setUsers } = useAuthStore.getState();
        const updatedUsers = users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            mutedThreads: u.mutedThreads?.filter(mt => mt.threadId !== threadId) || [],
          };
        });
        setUsers(updatedUsers);
      },

      // ============================================
      // CHECK IF THREAD IS MUTED
      // ============================================
      isThreadMuted: (userId, threadId) => {
        const { getUserById } = useAuthStore.getState();
        const user = getUserById(userId);
        return user?.mutedThreads?.some(mt => mt.threadId === threadId) || false;
      },

      // ============================================
      // NOTIFY THREAD REPLY
      // Creates notification when someone replies to your thread
      // Does NOT notify if thread is muted
      // Does NOT notify if you reply to your own thread
      // ============================================
      notifyThreadReply: (threadId, threadTitle, threadAuthorId, replyAuthorName) => {
        // Don't notify if thread is muted
        if (get().isThreadMuted(threadAuthorId, threadId)) return;
        
        get().createNotification({
          userId: threadAuthorId,
          type: 'thread_reply',
          message: `${replyAuthorName} replied to your thread "${threadTitle}"`,
          link: `/thread/${threadId}`,
          threadId,
          threadTitle,
        });
      },

      // ============================================
      // NOTIFY PROFILE COMMENT
      // Creates notification when someone comments on your profile
      // ============================================
      notifyProfileComment: (profileUserId, commentAuthorName, commentId) => {
        get().createNotification({
          userId: profileUserId,
          type: 'profile_comment',
          message: `${commentAuthorName} commented on your profile`,
          link: `/profile/${commentAuthorName}`,
          commentId,
          commentAuthorName,
        });
      },
    }),
    {
      name: 'watch-forum-notifications',
    }
  )
);

// Import auth store for user operations
import { useAuthStore } from './authStore';
