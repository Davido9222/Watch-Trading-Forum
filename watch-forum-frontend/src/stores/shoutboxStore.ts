// ============================================
// SHOUTBOX STORE
// Live group chat with 100 message limit and rate limiting
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

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
  lastMessageTime: number; // Timestamp of user's last message
  messageCountInWindow: number; // Messages sent in current 15-second window
  windowStartTime: number; // Start of current rate limit window
  
  // Actions
  sendMessage: (content: string, user: User) => { success: boolean; error?: string };
  getMessages: () => ShoutboxMessage[];
  clearMessages: () => void;
  canSendMessage: () => { allowed: boolean; remaining: number; secondsUntilReset: number };
}

// ============================================
// RATE LIMITING CONSTANTS
// ============================================
const MAX_MESSAGES_PER_WINDOW = 10;
const WINDOW_DURATION_MS = 15000; // 15 seconds
const MAX_MESSAGES_TOTAL = 100;

// ============================================
// INITIAL MESSAGES (Welcome messages)
// ============================================
const createInitialMessages = (): ShoutboxMessage[] => {
  const now = new Date();
  return [
    {
      id: 'welcome-1',
      content: 'Welcome to the Watch Trading Forums shoutbox! Be respectful and have fun! ⌚',
      authorId: 'system',
      authorName: 'System',
      authorRole: 'owner',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'welcome-2',
      content: 'Share your latest watch finds, ask questions, or just chat with fellow enthusiasts!',
      authorId: 'system',
      authorName: 'System',
      authorRole: 'owner',
      timestamp: new Date(now.getTime() - 3500000).toISOString(),
    },
  ];
};

export const useShoutboxStore = create<ShoutboxState>()(
  persist(
    (set, get) => ({
      messages: createInitialMessages(),
      lastMessageTime: 0,
      messageCountInWindow: 0,
      windowStartTime: 0,

      // ============================================
      // CHECK IF USER CAN SEND MESSAGE (Rate limiting)
      // ============================================
      canSendMessage: () => {
        const now = Date.now();
        const { windowStartTime, messageCountInWindow } = get();
        
        // Check if we're in a new window
        if (now - windowStartTime > WINDOW_DURATION_MS) {
          // New window started
          return { 
            allowed: true, 
            remaining: MAX_MESSAGES_PER_WINDOW, 
            secondsUntilReset: 0 
          };
        }
        
        // Still in current window
        const remaining = MAX_MESSAGES_PER_WINDOW - messageCountInWindow;
        const secondsUntilReset = Math.ceil((WINDOW_DURATION_MS - (now - windowStartTime)) / 1000);
        
        return {
          allowed: remaining > 0,
          remaining: Math.max(0, remaining),
          secondsUntilReset,
        };
      },

      // ============================================
      // SEND MESSAGE
      // ============================================
      sendMessage: (content, user) => {
        const trimmedContent = content.trim();
        
        if (!trimmedContent) {
          return { success: false, error: 'Message cannot be empty' };
        }
        
        if (trimmedContent.length > 500) {
          return { success: false, error: 'Message too long (max 500 characters)' };
        }
        
        // Check rate limit
        const rateLimit = get().canSendMessage();
        if (!rateLimit.allowed) {
          return { 
            success: false, 
            error: `Rate limit exceeded. You can send ${MAX_MESSAGES_PER_WINDOW} messages per 15 seconds. Please wait ${rateLimit.secondsUntilReset} seconds.` 
          };
        }
        
        const now = Date.now();
        const { windowStartTime, messageCountInWindow, messages } = get();
        
        // Update rate limit tracking
        let newWindowStart = windowStartTime;
        let newMessageCount = messageCountInWindow;
        
        if (now - windowStartTime > WINDOW_DURATION_MS) {
          // New window
          newWindowStart = now;
          newMessageCount = 1;
        } else {
          // Same window
          newMessageCount = messageCountInWindow + 1;
        }
        
        // Create new message
        const newMessage: ShoutboxMessage = {
          id: `msg-${now}-${Math.random().toString(36).substr(2, 9)}`,
          content: trimmedContent,
          authorId: user.id,
          authorName: user.username,
          authorAvatar: user.avatar,
          authorRole: user.role,
          timestamp: new Date().toISOString(),
        };
        
        // Add message and enforce 100 message limit
        let updatedMessages = [...messages, newMessage];
        if (updatedMessages.length > MAX_MESSAGES_TOTAL) {
          // Remove oldest messages (except system messages)
          const systemMessages = updatedMessages.filter(m => m.authorId === 'system');
          const userMessages = updatedMessages.filter(m => m.authorId !== 'system');
          
          // Keep only the most recent user messages
          const messagesToKeep = userMessages.slice(-(MAX_MESSAGES_TOTAL - systemMessages.length));
          updatedMessages = [...systemMessages, ...messagesToKeep];
        }
        
        set({
          messages: updatedMessages,
          lastMessageTime: now,
          messageCountInWindow: newMessageCount,
          windowStartTime: newWindowStart,
        });
        
        return { success: true };
      },

      // ============================================
      // GET ALL MESSAGES
      // ============================================
      getMessages: () => {
        return get().messages;
      },

      // ============================================
      // CLEAR ALL MESSAGES (Admin/Owner only)
      // ============================================
      clearMessages: () => {
        set({ messages: createInitialMessages() });
      },
    }),
    {
      name: 'shoutbox-storage',
    }
  )
);

export default useShoutboxStore;
