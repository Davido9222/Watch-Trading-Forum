// ============================================
// WATCH TRADING FORUMS - TYPES DEFINITION
// ============================================

// ============================================
// USER ROLE TYPES - Admin/Owner privileges system
// ============================================
export type UserRole = 'user' | 'admin' | 'owner';

// ============================================
// BADGE TYPES
// ============================================
export type BadgeType = 
  // Donor badges
  | 'donor_1k' | 'donor_2k' | 'donor_3k' | 'donor_4k' | 'donor_5k'
  | 'donor_10k' | 'donor_20k' | 'donor_25k' | 'donor_50k' | 'donor_100k'
  | 'donor_200k' | 'donor_400k' | 'donor_500k' | 'donor_1m'
  // Flappy Watch badges
  | 'flappy_player' | 'flappy_champion' | 'flappy_addict'
  // Account age badges
  | 'member_1y' | 'member_2y' | 'member_5y' | 'member_10y'
  // Optional admin badges
  | 'vip' | 'mvp' | 'goat'
  // Security badges
  | '2fa_enabled' | 'verified';

export interface UserBadge {
  id: string;
  type: BadgeType;
  awardedAt: string;
  awardedBy?: string; // Admin who awarded (for optional badges)
}

// ============================================
// HALL OF SHAME TYPE
// ============================================
export interface HallOfShameRecord {
  id: string;
  userId: string;
  username: string;
  reason: string;
  appliedBy: string;
  appliedByUsername: string;
  appliedAt: string;
  expiresAt: string;
  duration: '24h' | '7d';
  isActive: boolean;
}

// ============================================
// USER TYPE - Core user data structure
// ============================================
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  password: string; // Hashed in production
  role: UserRole;
  avatar?: string;
  motto: string;
  donorGif?: string; // URL to donor badge GIF
  badges: UserBadge[];
  isBanned: boolean;
  banReason?: string;
  bannedBy?: string; // Admin ID who banned
  bannedAt?: string;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  commentCount: number;
  
  // Security
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  recoveryPhrase?: string; // Only owner can view
  lastLoginAt?: string;
  lastLoginIP?: string;
  knownIPs: string[];
  
  // Flappy Watch stats
  flappyHighScore: number;
  flappyTotalScore: number;
  flappyGamesPlayed: number;
  
  // Hall of Shame
  hallOfShame?: HallOfShameRecord;
  
  // Social Media Links
  socialMedia?: {
    youtube?: string;
    x?: string; // Twitter/X
    instagram?: string;
  };
  
  // Profile Display Settings
  profileSettings?: {
    showPhone?: boolean;
    showYouTube?: boolean;
    showX?: boolean;
    showInstagram?: boolean;
  };
  
  // Country and Language
  country?: string;
  language?: string;
  
  // Karma system
  karma: number;
  
  // Muted threads (no notifications for these)
  mutedThreads: MutedThread[];
}

// ============================================
// BAN RECORD TYPE - For tracking admin bans
// ============================================
export interface BanRecord {
  id: string;
  userId: string;
  username: string;
  bannedBy: string; // Admin ID
  bannedByUsername: string;
  reason: string;
  bannedAt: string;
  unbannedAt?: string;
  unbannedBy?: string;
  isActive: boolean;
}

// ============================================
// ADMIN BAN ACTIVITY - For tracking admin actions
// ============================================
export interface AdminBanActivity {
  id: string;
  adminId: string;
  targetUserId: string;
  targetUsername: string;
  action: 'ban' | 'unban';
  reason?: string;
  timestamp: string;
}

// ============================================
// ADMIN BAN RATE LIMIT - For rate limiting tracking
// ============================================
export interface AdminBanRateLimit {
  adminId: string;
  banCount: number;
  hourStart: string;
}

// ============================================
// IP BAN TYPE
// ============================================
export interface IPBanRecord {
  id: string;
  ipAddress: string;
  reason: string;
  bannedBy: string;
  bannedByUsername: string;
  bannedAt: string;
  unbannedAt?: string;
  isActive: boolean;
  relatedUserIds: string[];
}

// ============================================
// MULTI-ACCOUNT NOTIFICATION
// ============================================
export interface MultiAccountAlert {
  id: string;
  ipAddress: string;
  userIds: string[];
  usernames: string[];
  detectedAt: string;
  isRead: boolean;
}

// ============================================
// FORUM SECTION TYPE - Main forum categories
// ============================================
export interface ForumSection {
  id: string;
  name: string;
  description: string;
  slug: string;
  isClickable: boolean;
  parentId?: string;
  order: number;
  icon?: string;
  threadCount: number;
  postCount: number;
  lastPostAt?: string;
  lastPostBy?: string;
  requiresOwner?: boolean; // For Owner-only posting sections
}

// ============================================
// THREAD TYPE - Forum posts/threads
// ============================================
export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  authorMotto: string;
  authorDonorGif?: string;
  sectionId: string;
  sectionName: string;
  images: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  lastCommentAt?: string;
  lastCommentBy?: string;
}

// ============================================
// COMMENT VOTE TYPE
// ============================================
export interface CommentVote {
  userId: string;
  vote: 'up' | 'down';
  votedAt: string;
}

// ============================================
// COMMENT TYPE - Thread comments/replies
// ============================================
export interface Comment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  authorMotto: string;
  authorDonorGif?: string;
  authorBadges: UserBadge[];
  authorHallOfShame?: HallOfShameRecord; // Hall of shame status
  images: string[];
  createdAt: string;
  updatedAt: string;
  // Voting system
  votes: CommentVote[];
  upvotes: number;
  downvotes: number;
}

// ============================================
// PROFILE UPDATE TYPE - User profile posts
// ============================================
export interface ProfileUpdate {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BLOG POST TYPE - SEO optimized blog posts with translations
// ============================================
export interface BlogPostTranslation {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface BlogPost {
  id: string;
  title: string; // English (default)
  slug: string; // English slug
  excerpt: string; // English excerpt
  content: string; // English content
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  featuredImage?: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  // Translations for SEO (only English shows in blog list)
  translations?: Record<string, BlogPostTranslation>;
}

// ============================================
// FLAPPY WATCH HIGH SCORE TYPE
// ============================================
export interface FlappyHighScore {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  achievedAt: string;
}

// ============================================
// FILTER TYPES
// ============================================
export type SortOption = 'newest' | 'hot';
export type TimeFilter = 'all' | '3months' | 'month' | 'week';

// ============================================
// NOTIFICATION TYPE
// ============================================
export type NotificationType = 'mention' | 'reply' | 'ban' | 'unban' | 'pin' | 'badge' | 'thread_reply' | 'profile_comment';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  // Extended fields for thread replies and profile comments
  threadId?: string;
  threadTitle?: string;
  commentId?: string;
  commentAuthorName?: string;
}

// Muted threads tracking (stored per user)
export interface MutedThread {
  threadId: string;
  mutedAt: string;
}
