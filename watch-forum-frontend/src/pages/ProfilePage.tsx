// ============================================
// PROFILE PAGE
// User profile with editable info, motto, updates
// Includes: Comments and posts section linking to all activity
// ============================================

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useForumStore } from '@/stores/forumStore';
import { useProfileStore } from '@/stores/profileStore';
import { useMessageStore } from '@/stores/messageStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { UserBadge, DonorBadge, EarnedBadges } from '@/components/user/UserBadge';
import { useFlappyStore, AVAILABLE_BADGES } from '@/stores/flappyStore';
import { uploadImage } from '@/utils/imageUpload';
import { api } from '@/lib/api';
import { Edit, MessageSquare, FileText, Calendar, Trash2, Plus, Camera, Shield, Key, Copy, Check, Award, Coins, Globe, MessageCircle, UserCog, AlertTriangle, Phone, Youtube, Twitter, Instagram } from 'lucide-react';

// ============================================
// GAME BADGES DISPLAY COMPONENT
// Shows Flappy Watch badges on profile
// ============================================
const GameBadgesDisplay: React.FC = () => {
  const { hasBadge } = useFlappyStore();
  const purchasedBadges = AVAILABLE_BADGES.filter(badge => hasBadge(badge.id));
  
  if (purchasedBadges.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <Coins className="h-4 w-4 text-yellow-600" />
      <span className="text-sm text-gray-600 mr-1">Flappy Watch Badges:</span>
      {purchasedBadges.map((badge) => (
        <div 
          key={badge.id}
          className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1"
          title={badge.description}
        >
          <img src={badge.image} alt={badge.name} className="w-5 h-5 object-contain" />
          <span className="text-xs font-medium">{badge.name}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// SOCIAL MEDIA LINKS COMPONENT
// ============================================
const SocialMediaLinks: React.FC<{ user: any }> = ({ user }) => {
  const socialMedia = user.socialMedia || {};
  const settings = user.profileSettings || {};
  
  const links = [];
  
  if (socialMedia.youtube && settings.showYouTube !== false) {
    links.push(
      <a 
        key="youtube"
        href={`https://youtube.com/@${socialMedia.youtube}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
        title={`YouTube: @${socialMedia.youtube}`}
      >
        <Youtube className="h-5 w-5" />
        <span className="text-sm font-medium">@{socialMedia.youtube}</span>
      </a>
    );
  }
  
  if (socialMedia.x && settings.showX !== false) {
    links.push(
      <a 
        key="x"
        href={`https://x.com/${socialMedia.x}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-gray-900 hover:text-gray-700 transition-colors"
        title={`X: @${socialMedia.x}`}
      >
        <Twitter className="h-5 w-5" />
        <span className="text-sm font-medium">@{socialMedia.x}</span>
      </a>
    );
  }
  
  if (socialMedia.instagram && settings.showInstagram !== false) {
    links.push(
      <a 
        key="instagram"
        href={`https://instagram.com/${socialMedia.instagram}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
        title={`Instagram: @${socialMedia.instagram}`}
      >
        <Instagram className="h-5 w-5" />
        <span className="text-sm font-medium">@{socialMedia.instagram}</span>
      </a>
    );
  }
  
  if (links.length === 0) return null;
  
  return (
    <div className="flex items-center gap-4 flex-wrap mb-4">
      {links}
    </div>
  );
};

// ============================================
// PHONE DISPLAY COMPONENT
// ============================================
const PhoneDisplay: React.FC<{ user: any }> = ({ user }) => {
  const settings = user.profileSettings || {};
  
  if (!user.phone || settings.showPhone !== true) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Phone className="h-4 w-4" />
      <span>{user.phone}</span>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { 
    currentUser, 
    getUserByUsername, 
    isAuthenticated,
    isOwner,
    viewUserMessages,
    checkUserIP,
    editUserProfile,
    isUserInHallOfShame,
    updateMotto,
    updateAvatar
  } = useAuthStore();
  const { getUserActivity } = useForumStore();
  const { getUpdatesByUser, createUpdate, deleteUpdate, loadUpdatesByUser } = useProfileStore();
  const { getMessagesBetweenUsers } = useMessageStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedMotto, setEditedMotto] = useState('');
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Owner Dialog States
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showIPDialog, setShowIPDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [ipInfo, setIpInfo] = useState<{ ip: string; sameIPUsers: any[] }>({ ip: '', sameIPUsers: [] });
  const [editForm, setEditForm] = useState({ motto: '', phone: '' });

  const [profileUser, setProfileUser] = useState<any>(
  username ? getUserByUsername(username) : undefined
);
const [profileLoading, setProfileLoading] = useState(!profileUser);
const isOwnProfile = isAuthenticated && currentUser?.username === username;

useEffect(() => {
  if (!username) return;
  // Always fetch fresh from the API — works for all users regardless of role
  api.get(`/users/${username}`)
    .then(data => {
      setProfileUser(data.user);
      setProfileLoading(false);
    })
    .catch(() => {
      setProfileUser(null);
      setProfileLoading(false);
    });
}, [username]);

// When the current user updates their own profile (avatar, motto, etc.),
// keep the profile view in sync
useEffect(() => {
  if (isOwnProfile && currentUser) {
    setProfileUser(currentUser);
  }
}, [currentUser, isOwnProfile]);

  useEffect(() => {
    if (profileUser) {
      loadUpdatesByUser(profileUser.id);
    }
  }, [profileUser, loadUpdatesByUser]);

  // Get user activity
  const activity = profileUser ? getUserActivity(profileUser.id) : { threads: [], comments: [] };
  const profileUpdates = profileUser ? getUpdatesByUser(profileUser.id) : [];

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const result = await uploadImage(file);
    
    if (result.success && result.url) {
      await updateAvatar(result.url);
    } else {
      alert(result.error || 'Failed to upload avatar');
    }
    
    setIsUploadingAvatar(false);
  };

  // Handle motto save
  const handleSaveMotto = async () => {
    await updateMotto(editedMotto);
    setIsEditing(false);
  };

  // Handle create profile update
  const handleCreateUpdate = async () => {
    if (!currentUser || !newUpdateContent.trim()) return;
    
    await createUpdate(currentUser.id, newUpdateContent);
    setNewUpdateContent('');
  };

  // Handle delete profile update
  const handleDeleteUpdate = async (updateId: string) => {
    await deleteUpdate(updateId);
  };

  // Owner: View User Messages
  const handleViewMessages = () => {
    if (!profileUser || !currentUser) return;
    
    const result = viewUserMessages(profileUser.id);
    if (result.success) {
      // Get messages between owner and this user
      const messages = getMessagesBetweenUsers(currentUser.id, profileUser.id);
      setUserMessages(messages);
      setShowMessageDialog(true);
    }
  };

  // Owner: Check User IP
  const handleCheckIP = () => {
    if (!profileUser) return;
    
    const info = checkUserIP(profileUser.id);
    setIpInfo(info);
    setShowIPDialog(true);
  };

  // Owner: Edit User Profile
  const handleEditProfile = () => {
    if (!profileUser) return;
    
    setEditForm({
      motto: profileUser.motto || '',
      phone: profileUser.phone || '',
    });
    setShowEditDialog(true);
  };

  // Owner: Save Edit Profile
  const handleSaveEdit = () => {
    if (!profileUser) return;
    
    const result = editUserProfile(profileUser.id, {
      motto: editForm.motto,
      phone: editForm.phone,
    });
    
    if (result.success) {
      setShowEditDialog(false);
      window.location.reload();
    } else {
      alert(result.error || 'Failed to update profile');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (profileLoading) {
   return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading profile...</p>
    </div>
   );
  }
  
  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600">The user you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================
          PROFILE HEADER
          ============================================ */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="text-3xl">
                  {profileUser.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Change Avatar Button (own profile only) */}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profileUser.username}</h1>
                <UserBadge role={profileUser.role} size="md" />
                {profileUser.donorGif && <DonorBadge gifUrl={profileUser.donorGif} size="lg" />}
              </div>

              {/* Motto */}
              <div className="flex items-center gap-2 mb-4">
                {isEditing && isOwnProfile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedMotto}
                      onChange={(e) => setEditedMotto(e.target.value)}
                      placeholder="Enter your motto..."
                      className="max-w-md"
                    />
                    <Button size="sm" onClick={handleSaveMotto}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    {profileUser.motto && (
                      <p className="text-lg text-gray-600 italic">&quot;{profileUser.motto}&quot;</p>
                    )}
                    {isOwnProfile && (
                      <button
                        onClick={() => {
                          setEditedMotto(profileUser.motto);
                          setIsEditing(true);
                        }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Phone Display */}
              <PhoneDisplay user={profileUser} />

              {/* Social Media Links */}
              <SocialMediaLinks user={profileUser} />

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{profileUser.postCount} posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{profileUser.commentCount} comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(profileUser.createdAt)}</span>
                </div>
                {/* Karma Display - Green if positive, Red if negative */}
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${(profileUser.karma || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Karma: {(profileUser.karma || 0) >= 0 ? `+${profileUser.karma || 0}` : profileUser.karma || 0}
                  </span>
                </div>
              </div>

              {/* Badges */}
              {(profileUser.badges?.length > 0 || profileUser.donorGif) && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <EarnedBadges 
                    badges={profileUser.badges || []} 
                    donorGif={profileUser.donorGif}
                    size="md"
                    showAll={true}
                  />
                </div>
              )}

              {/* Game Badges from Flappy Watch */}
              <GameBadgesDisplay />

              {/* Hall of Shame Badge */}
              {profileUser.hallOfShame && isUserInHallOfShame(profileUser.id) && (
                <div className="mt-4 p-3 bg-red-50 border-2 border-red-500 rounded-lg animate-pulse">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <p className="font-bold text-lg">HALL OF SHAME</p>
                      <p className="text-sm">{profileUser.hallOfShame.reason}</p>
                      <p className="text-xs">
                        Expires: {new Date(profileUser.hallOfShame.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {/* Message Button - Show on all profiles except own */}
                {!isOwnProfile && isAuthenticated && (
                  <Link to={`/messages?to=${profileUser.username}`}>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </Link>
                )}
                
                {/* View Messages Button - Only on own profile */}
                {isOwnProfile && (
                  <Link to="/messages">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      My Messages
                    </Button>
                  </Link>
                )}
                
                {/* Owner Actions - Only show for owner viewing other profiles */}
                {isOwner() && !isOwnProfile && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleViewMessages}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Messages
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCheckIP}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Check IP
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEditProfile}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          PROFILE CONTENT
          ============================================ */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">
              <FileText className="h-4 w-4 mr-2" />
              Comments and Posts
            </TabsTrigger>
            <TabsTrigger value="updates">
              <MessageSquare className="h-4 w-4 mr-2" />
              Profile Updates
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="settings">
                <Edit className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* ============================================
              COMMENTS AND POSTS TAB
              Shows all user activity on the forum
              ============================================ */}
          <TabsContent value="activity">
            <div className="space-y-6">
              {/* Threads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Threads ({activity.threads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.threads.length === 0 ? (
                    <p className="text-gray-500">No threads posted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activity.threads.map((thread) => (
                        <Link
                          key={thread.id}
                          to={`/thread/${thread.id}`}
                          className="block p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{thread.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                in {thread.sectionName} • {formatDate(thread.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{thread.viewCount} views</span>
                              <span>{thread.commentCount} comments</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({activity.comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.comments.length === 0 ? (
                    <p className="text-gray-500">No comments posted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activity.comments.map((comment) => (
                        <Link
                          key={comment.id}
                          to={`/thread/${comment.threadId}`}
                          className="block p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <p className="text-gray-700 line-clamp-2">{comment.content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {formatDate(comment.createdAt)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================
              PROFILE UPDATES TAB
              User can post updates on their profile
              These don&apos;t affect the forum
              ============================================ */}
          <TabsContent value="updates">
            <Card>
              <CardHeader>
                <CardTitle>Profile Updates</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add Update (own profile only) */}
                {isOwnProfile && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <Textarea
                      placeholder="Post an update to your profile... (e.g., links to vouch threads)"
                      value={newUpdateContent}
                      onChange={(e) => setNewUpdateContent(e.target.value)}
                      className="mb-3"
                    />
                    <Button 
                      onClick={handleCreateUpdate}
                      disabled={!newUpdateContent.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Post Update
                    </Button>
                  </div>
                )}

                {/* Updates List */}
                {profileUpdates.length === 0 ? (
                  <p className="text-gray-500">No updates yet.</p>
                ) : (
                  <div className="space-y-4">
                    {profileUpdates.map((update) => (
                      <div key={update.id} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap">{update.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-gray-500">
                            {formatDate(update.createdAt)}
                          </span>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUpdate(update.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================
              SETTINGS TAB (own profile only)
              ============================================ */}
          {isOwnProfile && (
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ============================================
          OWNER DIALOGS
          ============================================ */}
      
      {/* View Messages Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Messages with {profileUser?.username}</DialogTitle>
            <DialogDescription>
              Viewing conversation history
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {userMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages found</p>
            ) : (
              userMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-4 rounded-lg ${msg.senderId === currentUser?.id ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
                >
                  <p className="font-medium text-sm mb-1">{msg.subject}</p>
                  <p className="text-gray-700">{msg.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(msg.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Check IP Dialog */}
      <Dialog open={showIPDialog} onOpenChange={setShowIPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>IP Information for {profileUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>IP Address</Label>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">{ipInfo.ip || 'Unknown'}</p>
            </div>
            <div>
              <Label>Accounts with Same IP</Label>
              {ipInfo.sameIPUsers.length === 0 ? (
                <p className="text-gray-500">No other accounts found with this IP</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {ipInfo.sameIPUsers.map((user) => (
                    <Link 
                      key={user.id} 
                      to={`/profile/${user.username}`}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-blue-50"
                      onClick={() => setShowIPDialog(false)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile: {profileUser?.username}</DialogTitle>
            <DialogDescription>
              Owner can edit user profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-motto">Motto</Label>
              <Input
                id="edit-motto"
                value={editForm.motto}
                onChange={(e) => setEditForm({ ...editForm, motto: e.target.value })}
                placeholder="User motto"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================
// SETTINGS TAB COMPONENT
// Separate component for profile settings
// ============================================
const SettingsTab: React.FC = () => {
  const { 
    currentUser, 
    updateEmail, 
    updatePhone, 
    updateUsername, 
    changePassword, 
    updateMotto,
    updateSocialMedia,
    updateProfileSettings,
    enable2FA,
    disable2FA,
    verify2FA,
    setRecoveryPhrase,
    generateRecoveryPhrase
  } = useAuthStore();
  
  // Form states
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [motto, setMotto] = useState(currentUser?.motto || '');
  
  // Social media states
  const [youtube, setYoutube] = useState(currentUser?.socialMedia?.youtube || '');
  const [x, setX] = useState(currentUser?.socialMedia?.x || '');
  const [instagram, setInstagram] = useState(currentUser?.socialMedia?.instagram || '');
  
  // Profile settings states
  const [showPhone, setShowPhone] = useState(currentUser?.profileSettings?.showPhone || false);
  const [showYouTube, setShowYouTube] = useState(currentUser?.profileSettings?.showYouTube !== false);
  const [showX, setShowX] = useState(currentUser?.profileSettings?.showX !== false);
  const [showInstagram, setShowInstagram] = useState(currentUser?.profileSettings?.showInstagram !== false);

  // Re-sync local form state whenever the logged-in user record changes
  // (e.g. after the initial /auth/me load, or after saving). Without this
  // the toggles silently keep their first-render values and any save sends
  // stale data, making the "Show Phone" toggle appear broken.
  useEffect(() => {
    if (!currentUser) return;
    setUsername(currentUser.username || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setMotto(currentUser.motto || '');
    setYoutube(currentUser.socialMedia?.youtube || '');
    setX(currentUser.socialMedia?.x || '');
    setInstagram(currentUser.socialMedia?.instagram || '');
    setShowPhone(currentUser.profileSettings?.showPhone === true);
    setShowYouTube(currentUser.profileSettings?.showYouTube !== false);
    setShowX(currentUser.profileSettings?.showX !== false);
    setShowInstagram(currentUser.profileSettings?.showInstagram !== false);
  }, [currentUser?.id, currentUser?.username, currentUser?.email, currentUser?.phone, currentUser?.motto, currentUser?.socialMedia?.youtube, currentUser?.socialMedia?.x, currentUser?.socialMedia?.instagram, currentUser?.profileSettings?.showPhone, currentUser?.profileSettings?.showYouTube, currentUser?.profileSettings?.showX, currentUser?.profileSettings?.showInstagram]);
  
  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA states
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [showing2FASetup, setShowing2FASetup] = useState(false);
  
  // Recovery phrase states
  const [recoveryPhrase, setRecoveryPhraseState] = useState('');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  
  // Status messages
  const [usernameStatus, setUsernameStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [emailStatus, setEmailStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [mottoStatus, setMottoStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [twoFAStatus, setTwoFAStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [socialStatus, setSocialStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<{type: 'success'|'error', msg: string} | null>(null);

  if (!currentUser) return null;

  const handleUpdateUsername = async () => {
    setUsernameStatus(null);
    if (username === currentUser.username) {
      setUsernameStatus({ type: 'error', msg: 'No changes made' });
      return;
    }
    const result = await updateUsername(username);
    if (result.success) {
      setUsernameStatus({ type: 'success', msg: 'Username updated!' });
    } else {
      setUsernameStatus({ type: 'error', msg: result.error || 'Failed to update' });
    }
  };

  const handleUpdateEmail = async () => {
    setEmailStatus(null);
    if (email === currentUser.email) {
      setEmailStatus({ type: 'error', msg: 'No changes made' });
      return;
    }
    const result = await updateEmail(email);
    if (result.success) {
      setEmailStatus({ type: 'success', msg: 'Email updated!' });
    } else {
      setEmailStatus({ type: 'error', msg: result.error || 'Failed to update' });
    }
  };

  const handleUpdatePhone = async () => {
    setPhoneStatus(null);
    if (phone === (currentUser.phone || '')) {
      setPhoneStatus({ type: 'error', msg: 'No changes made' });
      return;
    }
    await updatePhone(phone);
    setPhoneStatus({ type: 'success', msg: 'Phone number updated!' });
  };

  const handleUpdateMotto = async () => {
    setMottoStatus(null);
    if (motto === currentUser.motto) {
      setMottoStatus({ type: 'error', msg: 'No changes made' });
      return;
    }
    await updateMotto(motto);
    setMottoStatus({ type: 'success', msg: 'Motto updated!' });
  };

  const handleUpdateSocialMedia = async () => {
    setSocialStatus(null);
    const result = await updateSocialMedia({ youtube, x, instagram });
    if (result.success) {
      setSocialStatus({ type: 'success', msg: 'Social media links updated!' });
    } else {
      setSocialStatus({ type: 'error', msg: result.error || 'Failed to update' });
    }
  };

  const handleUpdateProfileSettings = async () => {
    setSettingsStatus(null);
    const result = await updateProfileSettings({ showPhone, showYouTube, showX, showInstagram });
    if (result.success) {
      setSettingsStatus({ type: 'success', msg: 'Profile display settings updated!' });
    } else {
      setSettingsStatus({ type: 'error', msg: result.error || 'Failed to update' });
    }
  };

  const handleChangePassword = async () => {
    setPasswordStatus(null);
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'Password must be at least 6 characters' });
      return;
    }
    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      setPasswordStatus({ type: 'success', msg: 'Password changed!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({ type: 'error', msg: result.error || 'Failed to change password' });
    }
  };

  // 2FA handlers
  const handleEnable2FA = () => {
    setTwoFAStatus(null);
    const result = enable2FA();
    if (result.success && result.secret) {
      setTwoFactorSecret(result.secret);
      setShowing2FASetup(true);
    } else {
      setTwoFAStatus({ type: 'error', msg: result.error || 'Failed to enable 2FA' });
    }
  };

  const handleVerify2FA = () => {
    setTwoFAStatus(null);
    if (!twoFactorCode.trim()) {
      setTwoFAStatus({ type: 'error', msg: 'Enter verification code' });
      return;
    }
    const result = verify2FA(twoFactorCode);
    if (result.success) {
      setTwoFAStatus({ type: 'success', msg: '2FA enabled successfully!' });
      setShowing2FASetup(false);
      setTwoFactorCode('');
    } else {
      setTwoFAStatus({ type: 'error', msg: result.error || 'Invalid code' });
    }
  };

  const handleDisable2FA = () => {
    setTwoFAStatus(null);
    const result = disable2FA();
    if (result.success) {
      setTwoFAStatus({ type: 'success', msg: '2FA disabled successfully' });
    } else {
      setTwoFAStatus({ type: 'error', msg: result.error || 'Failed to disable 2FA' });
    }
  };

  // Recovery phrase handlers
  const handleGenerateRecoveryPhrase = () => {
    setRecoveryStatus(null);
    const phrase = generateRecoveryPhrase();
    setRecoveryPhraseState(phrase);
    setRecoveryStatus({ type: 'success', msg: 'Recovery phrase generated! Save it securely.' });
  };

  const handleSaveRecoveryPhrase = () => {
    setRecoveryStatus(null);
    if (!recoveryPhrase.trim()) {
      setRecoveryStatus({ type: 'error', msg: 'Generate a recovery phrase first' });
      return;
    }
    const result = setRecoveryPhrase(recoveryPhrase);
    if (result.success) {
      setRecoveryStatus({ type: 'success', msg: 'Recovery phrase saved!' });
    } else {
      setRecoveryStatus({ type: 'error', msg: result.error || 'Failed to save' });
    }
  };

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
              <Button 
                onClick={handleUpdateUsername}
                disabled={username === currentUser.username}
              >
                Update
              </Button>
            </div>
            {usernameStatus && (
              <p className={`text-sm mt-1 ${usernameStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {usernameStatus.msg}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
              />
              <Button 
                onClick={handleUpdateEmail}
                disabled={email === currentUser.email}
              >
                Update
              </Button>
            </div>
            {emailStatus && (
              <p className={`text-sm mt-1 ${emailStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {emailStatus.msg}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
              />
              <Button 
                onClick={handleUpdatePhone}
                disabled={phone === (currentUser.phone || '')}
              >
                Update
              </Button>
            </div>
            {phoneStatus && (
              <p className={`text-sm mt-1 ${phoneStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {phoneStatus.msg}
              </p>
            )}
          </div>

          {/* Motto */}
          <div>
            <Label htmlFor="motto">Motto</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="motto"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Your motto"
              />
              <Button 
                onClick={handleUpdateMotto}
                disabled={motto === currentUser.motto}
              >
                Update
              </Button>
            </div>
            {mottoStatus && (
              <p className={`text-sm mt-1 ${mottoStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {mottoStatus.msg}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Media Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Media Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* YouTube */}
          <div>
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              YouTube Username
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="youtube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="Your YouTube username (without @)"
              />
            </div>
          </div>

          {/* X/Twitter */}
          <div>
            <Label htmlFor="x" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              X (Twitter) Username
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="x"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="Your X username (without @)"
              />
            </div>
          </div>

          {/* Instagram */}
          <div>
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram Username
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Your Instagram username (without @)"
              />
            </div>
          </div>

          <Button onClick={handleUpdateSocialMedia}>
            Save Social Media
          </Button>
          {socialStatus && (
            <p className={`text-sm ${socialStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {socialStatus.msg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Profile Display Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Display Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose what information to display on your public profile
          </p>

          {/* Show Phone Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="show-phone" className="cursor-pointer">Show Phone Number</Label>
                <p className="text-xs text-gray-500">Display your phone number on your profile for trading</p>
              </div>
            </div>
            <Switch
              id="show-phone"
              checked={showPhone}
              onCheckedChange={setShowPhone}
            />
          </div>

          {/* Show YouTube Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              <div>
                <Label htmlFor="show-youtube" className="cursor-pointer">Show YouTube</Label>
                <p className="text-xs text-gray-500">Display YouTube link on your profile</p>
              </div>
            </div>
            <Switch
              id="show-youtube"
              checked={showYouTube}
              onCheckedChange={setShowYouTube}
            />
          </div>

          {/* Show X Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              <div>
                <Label htmlFor="show-x" className="cursor-pointer">Show X (Twitter)</Label>
                <p className="text-xs text-gray-500">Display X link on your profile</p>
              </div>
            </div>
            <Switch
              id="show-x"
              checked={showX}
              onCheckedChange={setShowX}
            />
          </div>

          {/* Show Instagram Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              <div>
                <Label htmlFor="show-instagram" className="cursor-pointer">Show Instagram</Label>
                <p className="text-xs text-gray-500">Display Instagram link on your profile</p>
              </div>
            </div>
            <Switch
              id="show-instagram"
              checked={showInstagram}
              onCheckedChange={setShowInstagram}
            />
          </div>

          <Button onClick={handleUpdateProfileSettings}>
            Save Display Settings
          </Button>
          {settingsStatus && (
            <p className={`text-sm ${settingsStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {settingsStatus.msg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="oldPassword">Current Password</Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleChangePassword}
            disabled={!oldPassword || !newPassword || !confirmPassword}
          >
            Change Password
          </Button>
          {passwordStatus && (
            <p className={`text-sm ${passwordStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {passwordStatus.msg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser.twoFactorEnabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">2FA is enabled</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Your account is protected with two-factor authentication. You&apos;ll need to enter a code from your authenticator app when logging in.
              </p>
              <Button variant="destructive" onClick={handleDisable2FA}>
                Disable 2FA
              </Button>
            </div>
          ) : showing2FASetup ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the verification code.
              </p>
              
              {/* QR Code Display */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  {/* Visual QR Code Pattern */}
                  <div className="w-48 h-48 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* QR Code Background */}
                      <rect width="100" height="100" fill="white"/>
                      
                      {/* Position Detection Patterns (corners) */}
                      <rect x="5" y="5" width="25" height="25" fill="black"/>
                      <rect x="8" y="8" width="19" height="19" fill="white"/>
                      <rect x="11" y="11" width="13" height="13" fill="black"/>
                      
                      <rect x="70" y="5" width="25" height="25" fill="black"/>
                      <rect x="73" y="8" width="19" height="19" fill="white"/>
                      <rect x="76" y="11" width="13" height="13" fill="black"/>
                      
                      <rect x="5" y="70" width="25" height="25" fill="black"/>
                      <rect x="8" y="73" width="19" height="19" fill="white"/>
                      <rect x="11" y="76" width="13" height="13" fill="black"/>
                      
                      {/* Data modules - generated pattern based on secret */}
                      {Array.from({ length: 25 }, (_, i) => {
                        const seed = twoFactorSecret.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                        return Array.from({ length: 25 }, (_, j) => {
                          const isPositionPattern = (i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7);
                          if (isPositionPattern) return null;
                          const shouldFill = ((seed + i * 7 + j * 13) % 17) < 10;
                          return shouldFill ? (
                            <rect 
                              key={`${i}-${j}`} 
                              x={10 + j * 3.2} 
                              y={10 + i * 3.2} 
                              width="2.8" 
                              height="2.8" 
                              fill="black"
                            />
                          ) : null;
                        });
                      })}
                      
                      {/* Timing patterns */}
                      <rect x="32" y="6" width="2" height="2" fill="black"/>
                      <rect x="36" y="6" width="2" height="2" fill="black"/>
                      <rect x="40" y="6" width="2" height="2" fill="black"/>
                      <rect x="44" y="6" width="2" height="2" fill="black"/>
                      <rect x="48" y="6" width="2" height="2" fill="black"/>
                      <rect x="52" y="6" width="2" height="2" fill="black"/>
                      <rect x="56" y="6" width="2" height="2" fill="black"/>
                      
                      <rect x="6" y="32" width="2" height="2" fill="black"/>
                      <rect x="6" y="36" width="2" height="2" fill="black"/>
                      <rect x="6" y="40" width="2" height="2" fill="black"/>
                      <rect x="6" y="44" width="2" height="2" fill="black"/>
                      <rect x="6" y="48" width="2" height="2" fill="black"/>
                      <rect x="6" y="52" width="2" height="2" fill="black"/>
                      <rect x="6" y="56" width="2" height="2" fill="black"/>
                    </svg>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">Scan with Authenticator App</p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm font-mono mb-2 break-all">Secret Key: {twoFactorSecret}</p>
                <p className="text-xs text-gray-500">Save this key in case you lose access to your authenticator app</p>
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <Button onClick={handleVerify2FA}>Verify</Button>
              </div>
              <Button variant="outline" onClick={() => setShowing2FASetup(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Add an extra layer of security to your account. When enabled, you&apos;ll need to enter a code from your authenticator app in addition to your password.
              </p>
              <Button onClick={handleEnable2FA} className="bg-blue-600">
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          )}
          {twoFAStatus && (
            <p className={`text-sm ${twoFAStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {twoFAStatus.msg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recovery Phrase Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Account Recovery Phrase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser.recoveryPhrase ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Recovery phrase is set</span>
              </div>
              <p className="text-sm text-gray-600">
                Your account has a recovery phrase set. Keep it safe - it&apos;s the only way to recover your account if you lose access.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Generate a recovery phrase to secure your account. This phrase can be used to recover your account if you forget your password or lose access to your 2FA device.
              </p>
              
              {!showRecoveryPhrase ? (
                <Button onClick={() => { handleGenerateRecoveryPhrase(); setShowRecoveryPhrase(true); }}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate Recovery Phrase
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2 font-medium">
                      Write down this phrase and keep it in a safe place!
                    </p>
                    <p className="font-mono text-lg break-all bg-white p-3 rounded border">
                      {recoveryPhrase}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyPhrase}
                      className="mt-2"
                    >
                      {copiedPhrase ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedPhrase ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveRecoveryPhrase}>
                      <Check className="h-4 w-4 mr-2" />
                      I&apos;ve Saved It
                    </Button>
                    <Button variant="outline" onClick={() => setShowRecoveryPhrase(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {recoveryStatus && (
            <p className={`text-sm ${recoveryStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {recoveryStatus.msg}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
