// ============================================
// COMMENT CARD COMPONENT
// Vote handler is now async: it awaits the backend
// (which updates karma server-side) so the displayed
// totals stay in sync across users and devices.
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comment, UserRole } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Award, Star, Trophy, Clock, ShieldCheck, Crown, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';

interface CommentCardProps {
  comment: Comment;
  currentUserId?: string;
  currentUserRole?: UserRole;
  onDelete?: (commentId: string) => void;
}

const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'bg-purple-600 hover:bg-purple-700 text-white';
    case 'admin': return 'bg-red-600 hover:bg-red-700 text-white';
    default: return '';
  }
};

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'Owner of site';
    case 'admin': return 'Admin';
    default: return '';
  }
};

const getBadgeInfo = (badgeType: string): { label: string; color: string; icon: React.ReactNode } | null => {
  const badgeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'flappy_player': { label: 'Flappy Player', color: 'bg-green-500', icon: <Award className="h-3 w-3" /> },
    'flappy_champion': { label: 'Flappy Champion', color: 'bg-yellow-500', icon: <Trophy className="h-3 w-3" /> },
    'flappy_addict': { label: 'Flappy Addict', color: 'bg-orange-500', icon: <Star className="h-3 w-3" /> },
    'member_1y': { label: '1Y Member', color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
    'member_2y': { label: '2Y Member', color: 'bg-blue-600', icon: <Clock className="h-3 w-3" /> },
    'member_5y': { label: '5Y Member', color: 'bg-blue-700', icon: <Clock className="h-3 w-3" /> },
    'member_10y': { label: '10Y Member', color: 'bg-blue-800', icon: <Clock className="h-3 w-3" /> },
    'vip': { label: 'VIP', color: 'bg-purple-600', icon: <Star className="h-3 w-3" /> },
    'mvp': { label: 'MVP', color: 'bg-blue-600', icon: <Award className="h-3 w-3" /> },
    'goat': { label: 'GOAT', color: 'bg-yellow-600', icon: <Crown className="h-3 w-3" /> },
    '2fa_enabled': { label: '2FA', color: 'bg-green-600', icon: <ShieldCheck className="h-3 w-3" /> },
    'verified': { label: 'Verified', color: 'bg-teal-500', icon: <ShieldCheck className="h-3 w-3" /> },
  };
  return badgeMap[badgeType] || null;
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (dateString: string): string =>
  new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  currentUserRole,
  onDelete,
}) => {
  const canDelete =
    currentUserId === comment.authorId ||
    currentUserRole === 'admin' ||
    currentUserRole === 'owner';

  const isHallOfShame = comment.authorHallOfShame &&
    new Date(comment.authorHallOfShame.expiresAt) > new Date();

  const { voteComment, getUserVote } = useForumStore();
  const { currentUser, updateKarma } = useAuthStore();
  const userVote = currentUser ? getUserVote(comment.id, currentUser.id) : null;
  const netVotes = (comment.upvotes || 0) - (comment.downvotes || 0);

  const [voting, setVoting] = useState(false);

  const handleVote = async (vote: 'up' | 'down') => {
    if (!currentUser || voting) return;
    if (currentUser.id === comment.authorId) return;
    setVoting(true);
    try {
      const result = await voteComment(comment.id, currentUser.id, vote);
      if (result && result.authorId && result.karmaChange !== 0) {
        updateKarma(result.authorId, result.karmaChange);
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 mb-3 relative ${isHallOfShame ? 'border-red-500 border-2' : 'border-gray-200'}`}>
      {isHallOfShame && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            HALL OF SHAME
          </div>
          <div className="text-xs text-red-600 text-center mt-1 bg-white px-2 py-0.5 rounded shadow">
            {comment.authorHallOfShame?.reason}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <Link to={`/profile/${comment.authorName}`} className="flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
            <AvatarFallback>{comment.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${comment.authorName}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {comment.authorName}
            </Link>
            {comment.authorMotto && (
              <span className="text-sm text-gray-500 italic truncate max-w-[200px]">
                "{comment.authorMotto}"
              </span>
            )}
            {(comment.authorRole === 'admin' || comment.authorRole === 'owner') && (
              <Badge className={`${getRoleBadgeColor(comment.authorRole)} ml-auto`}>
                {getRoleLabel(comment.authorRole)}
              </Badge>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {comment.authorDonorGif && (
              <img
                src={comment.authorDonorGif}
                alt="Donor Badge"
                className="h-7 w-auto object-contain"
              />
            )}
            {comment.authorBadges && comment.authorBadges.slice(0, 4).map((badge) => {
              if (badge.type.startsWith('donor_')) return null;
              const badgeInfo = getBadgeInfo(badge.type);
              if (!badgeInfo) return null;
              return (
                <Badge
                  key={badge.id}
                  className={`${badgeInfo.color} text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5`}
                >
                  {badgeInfo.icon}
                  <span>{badgeInfo.label}</span>
                </Badge>
              );
            })}
            {comment.authorBadges && comment.authorBadges.length > 4 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                +{comment.authorBadges.length - 4}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="pl-15 ml-15">
        <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>

        {comment.images && comment.images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {comment.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Comment image ${index + 1}`}
                className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-gray-200"
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Posted on {formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}</span>

            {currentUser && currentUser.id !== comment.authorId && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={voting}
                  onClick={() => handleVote('up')}
                  className={`p-1 h-7 ${userVote === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-green-600'}`}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className={`font-medium min-w-[20px] text-center ${netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {netVotes > 0 ? `+${netVotes}` : netVotes}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={voting}
                  onClick={() => handleVote('down')}
                  className={`p-1 h-7 ${userVote === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-red-600'}`}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!currentUser && (comment.upvotes > 0 || comment.downvotes > 0) && (
              <span className={`font-medium ${netVotes > 0 ? 'text-green-600' : netVotes < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {netVotes > 0 ? `+${netVotes}` : netVotes} votes
              </span>
            )}
          </div>

          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(comment.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
