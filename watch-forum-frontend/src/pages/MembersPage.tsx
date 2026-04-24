// ============================================
// MEMBERS PAGE — public member directory
// Anyone (logged in or not) can browse members.
// On mount we call loadPublicUsers() so the list
// is populated even when no token is present.
// ============================================

import React, { useEffect, useState } from 'react';
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
  const { getAllUsers, currentUser, isAuthenticated, loadPublicUsers, refreshUsers, isAdmin } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Public list works even when logged-out; admins also pull the full list
        await loadPublicUsers();
        if (isAuthenticated && isAdmin()) {
          await refreshUsers();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadPublicUsers, refreshUsers, isAuthenticated, isAdmin]);

  const allUsers = getAllUsers();

  const filteredUsers = allUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.motto || '').toLowerCase().includes(query)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.isBanned !== b.isBanned) return a.isBanned ? 1 : -1;
    return (b.postCount || 0) - (a.postCount || 0);
  });

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
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

        {searchQuery && (
          <p className="text-gray-600 mb-4">
            Found {sortedUsers.length} member{sortedUsers.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Loading members…</p>
          </div>
        ) : sortedUsers.length === 0 ? (
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
                    <Link to={`/profile/${user.username}`} className="flex-shrink-0">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-lg">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

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

                      {user.donorGif && (
                        <div className="mb-2">
                          <DonorBadge gifUrl={user.donorGif} size="sm" />
                        </div>
                      )}

                      {user.motto && (
                        <p className="text-sm text-gray-500 italic truncate mb-2">
                          "{user.motto}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{user.postCount || 0} posts</span>
                        <span>{user.commentCount || 0} comments</span>
                        <span>Joined {formatJoinDate(user.createdAt)}</span>
                      </div>

                      {user.isBanned && (
                        <Badge className="mt-2 bg-red-600 text-white">Banned</Badge>
                      )}

                      <div className="mt-3 flex gap-2">
                        <Link to={`/profile/${user.username}`}>
                          <Button variant="outline" size="sm">View Profile</Button>
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
