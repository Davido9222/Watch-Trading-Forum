// ============================================
// MEMBERS PAGE
// Search and browse all forum members
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserBadge, DonorBadge } from '@/components/user/UserBadge';
import { Search, Users, MessageSquare, ArrowLeft } from 'lucide-react';

export const MembersPage: React.FC = () => {
  const { getAllUsers, currentUser, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const allUsers = getAllUsers();
  
  // Filter users by search query
  const filteredUsers = allUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.motto.toLowerCase().includes(query)
    );
  });

  // Sort: Active users first, then by post count
  const sortedUsers = filteredUsers.sort((a, b) => {
    if (a.isBanned !== b.isBanned) return a.isBanned ? 1 : -1;
    return b.postCount - a.postCount;
  });

  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8" />
                Members
              </h1>
              <p className="text-gray-600 mt-1">
                Find and connect with other watch enthusiasts
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {allUsers.length} total members
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by username or motto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        {searchQuery && (
          <p className="text-gray-600 mb-4">
            Found {sortedUsers.length} member{sortedUsers.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Members Grid */}
        {sortedUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No members found</h2>
            <p className="text-gray-500 mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedUsers.map((user) => (
              <Card 
                key={user.id} 
                className={`hover:shadow-lg transition-shadow ${user.isBanned ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Link to={`/profile/${user.username}`} className="flex-shrink-0">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-lg">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link 
                          to={`/profile/${user.username}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {user.username}
                        </Link>
                        <UserBadge role={user.role} size="sm" />
                      </div>

                      {/* Donor Badge */}
                      {user.donorGif && (
                        <div className="mb-2">
                          <DonorBadge gifUrl={user.donorGif} size="sm" />
                        </div>
                      )}

                      {/* Motto */}
                      {user.motto && (
                        <p className="text-sm text-gray-500 italic truncate mb-2">
                          "{user.motto}"
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{user.postCount} posts</span>
                        <span>{user.commentCount} comments</span>
                        <span>Joined {formatJoinDate(user.createdAt)}</span>
                      </div>

                      {/* Banned Badge */}
                      {user.isBanned && (
                        <Badge className="mt-2 bg-red-600 text-white">
                          Banned
                        </Badge>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-3 flex gap-2">
                        <Link to={`/profile/${user.username}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        {isAuthenticated && currentUser?.id !== user.id && !user.isBanned && (
                          <Link to={`/messages?to=${user.username}`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPage;
