import { create } from 'zustand';
import type { ProfileUpdate } from '@/types';
import { api } from '@/lib/api';

interface ProfileState {
  profileUpdates: ProfileUpdate[];
  createUpdate: (userId: string, content: string) => Promise<ProfileUpdate>;
  loadUpdatesByUser: (userId: string) => Promise<void>;
  getUpdatesByUser: (userId: string) => ProfileUpdate[];
  deleteUpdate: (updateId: string) => Promise<void>;
  updateUpdate: (updateId: string, content: string) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profileUpdates: [],
  createUpdate: async (_userId, content) => {
    const data = await api.post('/profile-updates', { content });
    const update = data.update as ProfileUpdate;
    set(state => ({ profileUpdates: [update, ...state.profileUpdates] }));
    return update;
  },
  loadUpdatesByUser: async (userId) => {
    const data = await api.get(`/profile-updates/user/${userId}`);
    set(state => ({ profileUpdates: [...state.profileUpdates.filter(u => u.userId !== userId), ...(data.updates || [])] }));
  },
  getUpdatesByUser: (userId) => get().profileUpdates.filter(u => u.userId === userId).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),
  deleteUpdate: async (updateId) => { await api.del(`/profile-updates/${updateId}`); set(state => ({ profileUpdates: state.profileUpdates.filter(u => u.id !== updateId) })); },
  updateUpdate: () => undefined,
}));
