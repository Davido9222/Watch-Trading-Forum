// ============================================
// THREAD CARD COMPONENT
// Displays thread preview in forum sections
// Includes: Title, author info, view counter, comment counter
// Pinned threads have special styling
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import type { Thread, UserRole } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, MessageSquare, Eye, Lock } from 'lucide-react';

interface ThreadCardProps {
  thread: Thread;
}

// ============================================
// GET ROLE BADGE COLOR
// ============================================
const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case 'owner':
      return 'bg-purple-600 hover:bg-purple-700 text-white';
    case 'admin':
      return 'bg-red-600 hover:bg-red-700 text-white';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ============================================
// GET ROLE LABEL
// ============================================
const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    default:
      return 'Member';
  }
};

// ============================================
// FORMAT DATE
// ============================================
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  return (
    <div className={`bg-white border ${thread.isPinned ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'} rounded-lg p-4 mb-3 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link to={`/profile/${thread.authorName}`} className="flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={thread.authorAvatar} alt={thread.authorName} />
            <AvatarFallback>{thread.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        {/* Thread Info */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Pinned Badge */}
            {thread.isPinned && (
              <Badge className="bg-blue-600 text-white">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}

            {/* Locked Badge */}
            {thread.isLocked && (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}

            {/* Thread Title */}
            <Link 
              to={`/thread/${thread.id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-lg"
            >
              {thread.title}
            </Link>
          </div>

          {/* Author & Meta Row */}
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <span>by</span>
            <Link 
              to={`/profile/${thread.authorName}`}
              className="font-medium hover:text-blue-600 transition-colors"
            >
              {thread.authorName}
            </Link>
            
            {/* Role Badge */}
            <Badge className={`text-xs ${getRoleBadgeColor(thread.authorRole)}`}>
              {getRoleLabel(thread.authorRole)}
            </Badge>

            <span className="text-gray-400">•</span>
            <span>{formatDate(thread.createdAt)}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">in {thread.sectionName}</span>
          </div>

          {/* Preview Content */}
          <p className="mt-2 text-gray-700 line-clamp-2">
            {thread.content}
          </p>

          {/* Preview Images */}
          {thread.images && thread.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {thread.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thread image ${index + 1}`}
                  className="h-16 w-16 object-cover rounded border border-gray-200"
                />
              ))}
              {thread.images.length > 3 && (
                <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded border border-gray-200 text-gray-500 text-sm">
                  +{thread.images.length - 3}
                </div>
              )}
            </div>
          )}

          {/* ============================================
              STATS FOOTER
              View counter and comment counter at bottom
              ============================================ */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{thread.viewCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.commentCount} comments</span>
            </div>
            {thread.lastCommentAt && (
              <div className="ml-auto text-xs text-gray-400">
                Last reply {formatDate(thread.lastCommentAt)} by {thread.lastCommentBy}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;
