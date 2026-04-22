import { create } from 'zustand';
import type { User, BanRecord, UserRole, AdminBanActivity, AdminBanRateLimit, IPBanRecord, MultiAccountAlert, BadgeType, HallOfShameRecord } from '@/types';
import { api, setToken, getToken } from '@/lib/api';

type Result = { success: boolean; error?: string; message?: string; requires2FA?: boolean; pendingUserId?: string };

export type FlappyLeaderboardEntry = {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  totalScore: number;
  gamesPlayed: number;
};

interface AuthState {
  currentUser: User | null;
  users: User[];
  banRecords: BanRecord[];
  ipBanRecords: IPBanRecord[];
  adminBanActivity: AdminBanActivity[];
  adminBanRateLimits: AdminBanRateLimit[];
  multiAccountAlerts: MultiAccountAlert[];
  isAuthenticated: boolean;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  login: (email: string, password: string, ip?: string) => Promise<Result>;
  // Completes a 2FA-required login by submitting the 6-digit code.
  verify2FALogin: (pendingUserId: string, token: string) => Promise<Result>;
  register: (username: string, email: string, password: string, country?: string, language?: string, ip?: string) => Promise<Result>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateMotto: (motto: string) => Promise<void>;
  updateEmail: (email: string) => Promise<Result>;
  updatePhone: (phone: string) => Promise<void>;
  updateUsername: (username: string) => Promise<Result>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<Result>;
  updateSocialMedia: (socialMedia: { youtube?: string; x?: string; instagram?: string }) => Promise<Result>;
  updateProfileSettings: (settings: { showPhone?: boolean; showYouTube?: boolean; showX?: boolean; showInstagram?: boolean }) => Promise<Result>;
  // Note: implementations are async, but we keep the sync `Result` signature here
  // to stay compatible with existing call sites in AdminPanel.tsx.
  promoteToAdmin: (userId: string) => Result;
  demoteAdmin: (userId: string) => Result;
  getAdmins: () => User[];
  getAdminBanRecords: (adminId: string) => BanRecord[];
  viewRecoveryPhrase: (userId: string) => string | undefined;
  banUser: (userId: string, reason: string) => Result;
  unbanUser: (userId: string) => Result;
  getBanRecords: () => BanRecord[];
  getBanRecordsByAdmin: (adminId: string) => BanRecord[];
  canBanMoreUsers: (adminId: string) => { allowed: boolean; remaining: number; maxPerHour: number };
  banIP: (ip: string, reason: string) => Result;
  unbanIP: (ip: string) => Result;
  getIPBanRecords: () => IPBanRecord[];
  isIPBanned: (ip: string) => boolean;
  trackUserIP: (userId: string, ip: string) => void;
  getUsersByIP: (ip: string) => User[];
  getMultiAccountAlerts: () => MultiAccountAlert[];
  markAlertAsRead: (alertId: string) => void;
  dismissMultiAccountAlert: (alertId: string) => void;
  awardBadge: (userId: string, badgeType: BadgeType, awardedBy?: string) => Result;
  removeBadge: (userId: string, badgeId: string) => void;
  toggleBadgeVisibility: (userId: string, badgeType: BadgeType) => void;
  checkAndAwardAccountAgeBadges: (userId: string) => void;
  // Note: 2FA implementations are async, but the interface stays sync-shaped
  // for backwards compatibility with existing call sites in ProfilePage.tsx.
  enable2FA: () => Result & { secret?: string; qrCodeURL?: string };
  disable2FA: () => Result;
  verify2FA: (code: string) => Result;
  setRecoveryPhrase: (phrase: string) => Result;
  generateRecoveryPhrase: () => string;
  updateFlappyStats: (userId: string, score: number) => void;
  getFlappyLeaderboard: () => Promise<FlappyLeaderboardEntry[]>;
  getFlappyTotalLeaderboard: () => Promise<FlappyLeaderboardEntry[]>;
  assignDonorGif: (userId: string, gifUrl: string) => void;
  removeDonorGif: (userId: string) => void;
  getDonorBadgeUrl: (amount: number) => string;
  getUserById: (userId: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  getAllUsers: () => User[];
  isAdmin: () => boolean;
  isOwner: () => boolean;
  canModerate: () => boolean;
  viewUserMessages: (userId: string) => Result;
  checkUserIP: (userId: string) => { ip: string; sameIPUsers: User[] };
  editUserProfile: (userId: string, updates: Partial<User>) => Result;
  applyHallOfShame: (userId: string, reason: string, duration: '24h' | '7d') => Result;
  removeHallOfShame: (userId: string) => Result;
  getActiveHallOfShame: () => HallOfShameRecord[];
  checkHallOfShameExpired: () => void;
  isUserInHallOfShame: (userId: string) => boolean;
  updateKarma: (userId: string, amount: number) => void;
  getKarma: (userId: string) => number;
  setUsers: (users: User[]) => void;
}

const DONOR_BADGE_URLS: Record<number, string> = { 1000: '/donor-badge-1000.png', 2000: '/donor-badge-2k.png', 3000: '/donor-badge-3k.png', 4000: '/donor-badge-4k.png', 5000: '/donor-badge-5k.png', 10000: '/donor-badge-10k.png', 20000: '/donor-badge-20k.png', 25000: '/donor-badge-25k.png', 50000: '/donor-badge-50k.png', 100000: '/donor-badge-100k.png', 200000: '/donor-badge-200k.png', 400000: '/donor-badge-400k.png', 500000: '/donor-badge-500k.png', 1000000: '/donor-badge-1m.png' };

// Cache the leaderboard fetch so we don't hammer the API.
let leaderboardCache: { at: number; data: FlappyLeaderboardEntry[] } | null = null;
const LEADERBOARD_TTL_MS = 5000;

async function fetchFlappyLeaderboard(): Promise<FlappyLeaderboardEntry[]> {
  const now = Date.now();
  if (leaderboardCache && now - leaderboardCache.at < LEADERBOARD_TTL_MS) {
    return leaderboardCache.data;
  }
  try {
    const data = await api.get('/users/leaderboard/flappy');
    const list: FlappyLeaderboardEntry[] = (data.leaderboard || []).map((u: any) => ({
      userId: u.userId,
      username: u.username,
      avatar: u.avatar || '',
      score: typeof u.highScore === 'number' ? u.highScore : (u.score || 0),
      totalScore: u.totalScore || 0,
      gamesPlayed: u.gamesPlayed || 0,
    }));
    leaderboardCache = { at: now, data: list };
    return list;
  } catch {
    return leaderboardCache?.data || [];
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: [],
  banRecords: [],
  ipBanRecords: [],
  adminBanActivity: [],
  adminBanRateLimits: [],
  multiAccountAlerts: [],
  isAuthenticated: false,
  isInitializing: false,
  initialize: async () => {
    if (get().isInitializing) return;
    set({ isInitializing: true });
    try {
      if (getToken()) {
        const data = await api.get('/auth/me');
        set({ currentUser: data.user, isAuthenticated: true });
        // refresh users only if logged in (admin endpoint requires auth anyway)
        await get().refreshUsers();
      }
    } catch {
      setToken(null);
      set({ currentUser: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },
  refreshUsers: async () => {
    try {
      const data = await api.get('/users');
      set({ users: data.users || [] });
    } catch {
      // listing users requires admin role — ignore failures for normal users
    }
  },
  login: async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.requires2FA) {
        // Tell the LoginPage to show the 6-digit code input.
        return { success: false, requires2FA: true, pendingUserId: data.pendingUserId, message: 'requires2FA' };
      }
      setToken(data.token);
      set({ currentUser: data.user, isAuthenticated: true });
      get().refreshUsers().catch(() => {});
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },
  verify2FALogin: async (pendingUserId, token) => {
    try {
      const data = await api.post('/2fa/login-verify', { pendingUserId, token });
      setToken(data.token);
      set({ currentUser: data.user, isAuthenticated: true });
      get().refreshUsers().catch(() => {});
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Invalid code' };
    }
  },
  register: async (username, email, password, country, language) => {
    try {
      const data = await api.post('/auth/register', { username, email, password, country, language });
      setToken(data.token);
      set({ currentUser: data.user, isAuthenticated: true });
      get().refreshUsers().catch(() => {});
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  },
  logout: () => {
    setToken(null);
    set({ currentUser: null, isAuthenticated: false });
  },
  updateProfile: async (updates) => {
    const data = await api.patch('/users/me/profile', updates);
    set((state) => ({
      currentUser: data.user,
      users: state.users.map((u) => (u.id === data.user.id ? data.user : u)),
    }));
  },
  updateAvatar: async (avatarUrl) => { await get().updateProfile({ avatar: avatarUrl }); },
  updateMotto: async (motto) => { await get().updateProfile({ motto }); },
  updateEmail: async (email) => { try { await get().updateProfile({ email }); return { success: true }; } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' }; } },
  updatePhone: async (phone) => { await get().updateProfile({ phone }); },
  updateUsername: async (username) => { try { await get().updateProfile({ username }); return { success: true }; } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' }; } },
  changePassword: async (oldPassword, newPassword) => { try { await api.post('/users/me/change-password', { oldPassword, newPassword }); return { success: true }; } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' }; } },
  updateSocialMedia: async (socialMedia) => { try { await get().updateProfile({ socialMedia } as any); return { success: true }; } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' }; } },
  updateProfileSettings: async (profileSettings) => {
    try {
      // Merge with existing settings so we don't accidentally erase other toggles
      const merged = { ...(get().currentUser?.profileSettings || {}), ...profileSettings };
      await get().updateProfile({ profileSettings: merged } as any);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' };
    }
  },
  promoteToAdmin: async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: 'admin' });
      await get().refreshUsers();
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  demoteAdmin: async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: 'user' });
      await get().refreshUsers();
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  getAdmins: () => get().users.filter(u => u.role === 'admin'),
  getAdminBanRecords: (adminId) => get().banRecords.filter(b => b.bannedBy === adminId),
  viewRecoveryPhrase: (userId) => get().users.find(u => u.id === userId)?.recoveryPhrase,
  banUser: async (userId: string, reason: string) => {
    try {
      await api.post(`/users/${userId}/ban`, { reason });
      await get().refreshUsers();
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  unbanUser: async (userId: string) => {
    try {
      await api.del(`/users/${userId}/ban`);
      await get().refreshUsers();
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  getBanRecords: () => get().banRecords,
  getBanRecordsByAdmin: (adminId) => get().banRecords.filter(r => r.bannedBy === adminId),
  canBanMoreUsers: () => ({ allowed: false, remaining: 0, maxPerHour: 0 }),
  banIP: () => ({ success: false, error: 'Not implemented yet' }),
  unbanIP: () => ({ success: false, error: 'Not implemented yet' }),
  getIPBanRecords: () => get().ipBanRecords,
  isIPBanned: (ip) => get().ipBanRecords.some(r => r.ipAddress === ip && r.isActive),
  trackUserIP: () => undefined,
  getUsersByIP: (ip) => get().users.filter(u => u.knownIPs?.includes(ip)),
  getMultiAccountAlerts: () => get().multiAccountAlerts,
  markAlertAsRead: (alertId) => set(state => ({ multiAccountAlerts: state.multiAccountAlerts.map(a => a.id === alertId ? { ...a, isRead: true } : a) })),
  dismissMultiAccountAlert: (alertId) => set(state => ({ multiAccountAlerts: state.multiAccountAlerts.filter(a => a.id !== alertId) })),
  awardBadge: () => ({ success: false, error: 'Not implemented yet' }),
  removeBadge: () => undefined,
  toggleBadgeVisibility: () => undefined,
  checkAndAwardAccountAgeBadges: () => undefined,
  enable2FA: async () => {
    try {
      const data = await api.post('/2fa/setup');
      return { success: true, qrCodeURL: data.qrCodeURL, secret: data.secret };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  disable2FA: async () => {
    try {
      await api.post('/2fa/disable');
      set(state => ({ currentUser: state.currentUser ? { ...state.currentUser, twoFactorEnabled: false } : null }));
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  verify2FA: async (token: string) => {
    try {
      await api.post('/2fa/enable', { token });
      set(state => ({ currentUser: state.currentUser ? { ...state.currentUser, twoFactorEnabled: true } : null }));
      return { success: true };
    } catch (e: any) { return { success: false, error: e.message }; }
  },
  setRecoveryPhrase: () => ({ success: false, error: 'Not implemented yet' }),
  generateRecoveryPhrase: () => Array.from({ length: 12 }, () => ['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango','uniform','victor','whiskey','xray','yankee','zulu'][Math.floor(Math.random()*26)]).join(' '),
  updateFlappyStats: async (_userId: string, score: number) => {
    try {
      await api.post('/users/me/flappy-stats', { score });
      // bust the cache so next leaderboard fetch is fresh
      leaderboardCache = null;
      // refresh current user (high score field) but skip refreshUsers (admin-only)
      try {
        const data = await api.get('/auth/me');
        set({ currentUser: data.user });
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  },
  getFlappyLeaderboard: () => fetchFlappyLeaderboard(),
  getFlappyTotalLeaderboard: async () => {
    const list = await fetchFlappyLeaderboard();
    return [...list].sort((a, b) => b.totalScore - a.totalScore);
  },
  assignDonorGif: () => undefined,
  removeDonorGif: () => undefined,
  getDonorBadgeUrl: (amount) => { const amounts = Object.keys(DONOR_BADGE_URLS).map(Number).sort((a,b)=>b-a); const applicable = amounts.find(a => amount >= a); return applicable ? DONOR_BADGE_URLS[applicable] : ''; },
  getUserById: (userId) => get().users.find(u => u.id === userId),
  getUserByUsername: (username) => get().users.find(u => u.username === username),
  getAllUsers: () => get().users,
  isAdmin: () => get().currentUser?.role === 'admin' || get().currentUser?.role === 'owner',
  isOwner: () => get().currentUser?.role === 'owner',
  canModerate: () => ['admin', 'owner'].includes(get().currentUser?.role || ''),
  viewUserMessages: () => ({ success: false, error: 'Not implemented yet' }),
  checkUserIP: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (!user?.lastLoginIP) return { ip: '', sameIPUsers: [] };
    return { ip: user.lastLoginIP, sameIPUsers: get().users.filter(u => u.id !== userId && u.lastLoginIP === user.lastLoginIP) };
  },
  editUserProfile: () => ({ success: false, error: 'Not implemented yet' }),
  applyHallOfShame: () => ({ success: false, error: 'Not implemented yet' }),
  removeHallOfShame: () => ({ success: false, error: 'Not implemented yet' }),
  getActiveHallOfShame: () => get().users.filter(u => u.hallOfShame).map(u => u.hallOfShame as HallOfShameRecord),
  checkHallOfShameExpired: () => undefined,
  isUserInHallOfShame: (userId) => !!get().users.find(u => u.id === userId)?.hallOfShame,
  updateKarma: (userId, amount) => set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, karma: (u.karma || 0) + amount } : u), currentUser: state.currentUser?.id === userId ? { ...state.currentUser, karma: (state.currentUser.karma || 0) + amount } : state.currentUser })),
  getKarma: (userId) => get().users.find(u => u.id === userId)?.karma || 0,
  setUsers: (users) => set({ users }),
}));
