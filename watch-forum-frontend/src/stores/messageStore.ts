import { create } from 'zustand';
import type { Message, Conversation } from '@/types/messages';
import { api } from '@/lib/api';

interface MessageState {
  messages: Message[];
  isInitialized: boolean;
  initialize: () => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => Promise<Message>;
  getMessagesBetweenUsers: (userId1: string, userId2: string) => Message[];
  getConversations: (userId: string) => Conversation[];
  getUnreadCount: (userId: string) => number;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (userId: string, senderId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  getSentMessages: (userId: string) => Message[];
  getReceivedMessages: (userId: string) => Message[];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isInitialized: false,
  initialize: async () => {
    try {
      const data = await api.get('/messages');
      set({ messages: data.messages || [], isInitialized: true });
    } catch {
      set({ messages: [], isInitialized: true });
    }
  },
  sendMessage: async (messageData) => {
    const data = await api.post('/messages', messageData);
    const newMessage = data.message as Message;
    set(state => ({ messages: [...state.messages, newMessage] }));
    return newMessage;
  },
  getMessagesBetweenUsers: (userId1, userId2) => get().messages.filter(m => (m.senderId === userId1 && m.recipientId === userId2) || (m.senderId === userId2 && m.recipientId === userId1)).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()),
  getConversations: (userId) => {
    const conversations = new Map<string, Conversation>();
    get().messages.filter(m => m.senderId === userId || m.recipientId === userId).forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const otherUserName = msg.senderId === userId ? msg.recipientName : msg.senderName;
      const otherUserAvatar = msg.senderId === userId ? undefined : msg.senderAvatar;
      const existing = conversations.get(otherUserId);
      const msgDate = new Date(msg.createdAt).getTime();
      if (!existing || msgDate > new Date(existing.lastMessageAt).getTime()) {
        conversations.set(otherUserId, { userId: otherUserId, username: otherUserName, avatar: otherUserAvatar, lastMessage: msg.content.slice(0,50) + (msg.content.length>50?'...':''), lastMessageAt: msg.createdAt, unreadCount: msg.recipientId === userId && !msg.isRead ? 1 : 0 });
      } else if (msg.recipientId === userId && !msg.isRead) {
        existing.unreadCount += 1;
      }
    });
    return Array.from(conversations.values()).sort((a,b)=>new Date(b.lastMessageAt).getTime()-new Date(a.lastMessageAt).getTime());
  },
  getUnreadCount: (userId) => get().messages.filter(m => m.recipientId === userId && !m.isRead).length,
  markAsRead: async (messageId) => { await api.patch(`/messages/${messageId}/read`, {}); set(state => ({ messages: state.messages.map(m => m.id===messageId ? { ...m, isRead: true } : m) })); },
  markAllAsRead: async (_userId, senderId) => { await api.post(`/messages/conversations/${senderId}/read`, {}); set(state => ({ messages: state.messages.map(m => m.senderId===senderId ? { ...m, isRead: true } : m) })); },
  deleteMessage: (messageId) => set(state => ({ messages: state.messages.filter(m => m.id !== messageId) })),
  getSentMessages: (userId) => get().messages.filter(m => m.senderId === userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),
  getReceivedMessages: (userId) => get().messages.filter(m => m.recipientId === userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),
}));
