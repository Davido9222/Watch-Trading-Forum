// ============================================
// USER BADGE COMPONENT
// Displays user role badges (Admin, Owner, Donor) and earned badges
// Used throughout the forum for user identification
// ============================================

import React from 'react';
import type { UserRole, UserBadge as UserBadgeType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Award, Star, Trophy, Clock, ShieldCheck } from 'lucide-react';

interface UserBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// GET BADGE STYLES BASED ON ROLE
// ============================================
const getBadgeStyles = (role: UserRole): string => {
  switch (role) {
    case 'owner':
      return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600';
    case 'admin':
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// ============================================
// GET ROLE LABEL
// ============================================
const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'owner':
      return 'Owner of site';
    case 'admin':
      return 'Admin';
    default:
      return 'Member';
  }
};

// ============================================
// GET ROLE ICON
// ============================================
const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'owner':
      return <Crown className="h-3 w-3" />;
    case 'admin':
      return <Shield className="h-3 w-3" />;
    default:
      return null;
  }
};

// ============================================
// SIZE CLASSES
// ============================================
const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'text-xs px-2 py-0.5';
    case 'lg':
      return 'text-sm px-3 py-1.5';
    default:
      return 'text-xs px-2.5 py-1';
  }
};

export const UserBadge: React.FC<UserBadgeProps> = ({ 
  role, 
  showIcon = true,
  size = 'md' 
}) => {
  if (role === 'user') return null;

  return (
    <Badge 
      className={`${getBadgeStyles(role)} ${getSizeClasses(size)} font-medium`}
    >
      {showIcon && getRoleIcon(role)}
      <span className={showIcon ? 'ml-1' : ''}>{getRoleLabel(role)}</span>
    </Badge>
  );
};

// ============================================
// DONOR BADGE COMPONENT
// Displays donor GIF badge
// ============================================
interface DonorBadgeProps {
  gifUrl: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================
// DONOR BADGE SIZES - Made bigger for mobile visibility
// ============================================
const getDonorSize = (size: 'sm' | 'md' | 'lg' | 'xl'): string => {
  switch (size) {
    case 'sm':
      return 'h-8 md:h-6';  // 32px mobile, 24px desktop
    case 'lg':
      return 'h-20 md:h-16'; // 80px mobile, 64px desktop
    case 'xl':
      return 'h-24 md:h-20'; // 96px mobile, 80px desktop
    default:
      return 'h-14 md:h-10'; // 56px mobile, 40px desktop (default is now bigger)
  }
};

export const DonorBadge: React.FC<DonorBadgeProps> = ({ gifUrl, size = 'md' }) => {
  return (
    <img 
      src={gifUrl}
      alt="Donor Badge"
      className={`${getDonorSize(size)} w-auto object-contain`}
    />
  );
};

// ============================================
// COMBINED USER INFO BADGE
// Shows role and donor status together
// ============================================
interface UserInfoBadgeProps {
  role: UserRole;
  donorGif?: string;
  motto?: string;
  showMotto?: boolean;
}

export const UserInfoBadge: React.FC<UserInfoBadgeProps> = ({ 
  role, 
  donorGif,
  motto,
  showMotto = true
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <UserBadge role={role} />
      {donorGif && <DonorBadge gifUrl={donorGif} size="sm" />}
      {showMotto && motto && (
        <span className="text-sm text-gray-500 italic">
          "{motto}"
        </span>
      )}
    </div>
  );
};

// ============================================
// EARNED BADGES DISPLAY COMPONENT
// Shows all badges a user has earned
// ============================================
interface EarnedBadgesProps {
  badges: UserBadgeType[];
  donorGif?: string;
  size?: 'sm' | 'md' | 'lg';
  showAll?: boolean;
}

// Badge type to display info mapping
const BADGE_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'donor_1k': { label: '$1K Donor', color: 'bg-green-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_2k': { label: '$2K Donor', color: 'bg-green-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_3k': { label: '$3K Donor', color: 'bg-teal-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_4k': { label: '$4K Donor', color: 'bg-teal-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_5k': { label: '$5K Donor', color: 'bg-blue-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_10k': { label: '$10K Donor', color: 'bg-blue-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_20k': { label: '$20K Donor', color: 'bg-indigo-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_25k': { label: '$25K Donor', color: 'bg-indigo-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_50k': { label: '$50K Donor', color: 'bg-purple-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_100k': { label: '$100K Donor', color: 'bg-purple-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_200k': { label: '$200K Donor', color: 'bg-pink-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_400k': { label: '$400K Donor', color: 'bg-pink-700', icon: <Trophy className="h-3 w-3" /> },
  'donor_500k': { label: '$500K Donor', color: 'bg-rose-600', icon: <Trophy className="h-3 w-3" /> },
  'donor_1m': { label: '$1M+ Donor', color: 'bg-yellow-600', icon: <Crown className="h-3 w-3" /> },
  'flappy_player': { label: 'Flappy Player', color: 'bg-green-500', icon: <Award className="h-3 w-3" /> },
  'flappy_champion': { label: 'Flappy Champion', color: 'bg-yellow-500', icon: <Trophy className="h-3 w-3" /> },
  'flappy_addict': { label: 'Flappy Addict', color: 'bg-orange-500', icon: <Star className="h-3 w-3" /> },
  'member_1y': { label: '1 Year Member', color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
  'member_2y': { label: '2 Year Member', color: 'bg-blue-600', icon: <Clock className="h-3 w-3" /> },
  'member_5y': { label: '5 Year Member', color: 'bg-blue-700', icon: <Clock className="h-3 w-3" /> },
  'member_10y': { label: '10 Year Member', color: 'bg-blue-800', icon: <Clock className="h-3 w-3" /> },
  'vip': { label: 'VIP', color: 'bg-purple-600', icon: <Star className="h-3 w-3" /> },
  'mvp': { label: 'MVP', color: 'bg-blue-600', icon: <Award className="h-3 w-3" /> },
  'goat': { label: 'GOAT', color: 'bg-yellow-600', icon: <Crown className="h-3 w-3" /> },
  '2fa_enabled': { label: '2FA Secured', color: 'bg-green-600', icon: <ShieldCheck className="h-3 w-3" /> },
  'verified': { label: 'Verified', color: 'bg-teal-500', icon: <Shield className="h-3 w-3" /> },
};

export const EarnedBadges: React.FC<EarnedBadgesProps> = ({ 
  badges, 
  donorGif,
  size = 'md',
  showAll = false 
}) => {
  if (!badges || badges.length === 0) return null;

  const displayBadges = showAll ? badges : badges.slice(0, 5);
  const hasMore = badges.length > 5 && !showAll;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Donor badge first if exists */}
      {donorGif && (
        <img 
          src={donorGif} 
          alt="Donor" 
          className={size === 'sm' ? 'h-5' : size === 'lg' ? 'h-10' : 'h-7'} 
        />
      )}
      
      {/* Other badges */}
      {displayBadges.map((badge) => {
        const info = BADGE_INFO[badge.type];
        if (!info) return null;
        
        // Skip donor badges as they're shown via donorGif
        if (badge.type.startsWith('donor_')) return null;
        
        return (
          <Badge 
            key={badge.id}
            className={`${info.color} text-white ${sizeClasses[size]} font-medium flex items-center gap-1`}
          >
            {info.icon}
            <span>{info.label}</span>
          </Badge>
        );
      })}
      
      {hasMore && (
        <Badge variant="secondary" className={`${sizeClasses[size]}`}>
          +{badges.length - 5} more
        </Badge>
      )}
    </div>
  );
};

export default UserBadge;
