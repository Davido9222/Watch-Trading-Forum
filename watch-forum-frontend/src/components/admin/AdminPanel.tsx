// ============================================
// ADMIN PANEL COMPONENT
// Changes in this version:
//   • The "User Management" tab now lists EVERY user (including
//     admins), so admin accounts are visible and editable.
//   • New "Edit Profile" dialog lets admin/owner change a user's
//     motto / avatar URL / donor GIF / social links via the new
//     PATCH /api/users/:id endpoint.
//   • The "Ban History" tab uses real bannedByUsername that we
//     now persist to MongoDB (no more "Unknown").
// ============================================

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { User, UserBadge } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Ban, UserCheck, Gift, History, Shield, HelpCircle, Info,
  Crown, AlertTriangle, Globe, Award, X, Eye, Skull, Pencil
} from 'lucide-react';

const DONOR_BADGES = [
  { value: '/donor-badge-1000.png', label: '$1,000 Donor', tier: '1k' },
  { value: '/donor-badge-2000.png', label: '$2,000 Donor', tier: '2k' },
  { value: '/donor-badge-3000.png', label: '$3,000 Donor', tier: '3k' },
  { value: '/donor-badge-4000.png', label: '$4,000 Donor', tier: '4k' },
  { value: '/donor-badge-5000.png', label: '$5,000 Donor', tier: '5k' },
  { value: '/donor-badge-10000.png', label: '$10,000 Donor', tier: '10k' },
  { value: '/donor-badge-20000.png', label: '$20,000 Donor', tier: '20k' },
  { value: '/donor-badge-25000.png', label: '$25,000 Donor', tier: '25k' },
  { value: '/donor-badge-50000.png', label: '$50,000 Donor', tier: '50k' },
  { value: '/donor-badge-100000.png', label: '$100,000 Donor', tier: '100k' },
  { value: '/donor-badge-200000.png', label: '$200,000 Donor', tier: '200k' },
  { value: '/donor-badge-400000.png', label: '$400,000 Donor', tier: '400k' },
  { value: '/donor-badge-500000.png', label: '$500,000 Donor', tier: '500k' },
  { value: '/donor-badge-1000000.png', label: '$1M+ Donor', tier: '1m' },
];

const ASSIGNABLE_BADGES = [
  { type: 'vip', label: 'VIP', description: 'Very Important Person', color: 'bg-purple-600' },
  { type: 'mvp', label: 'MVP', description: 'Most Valuable Player', color: 'bg-blue-600' },
  { type: 'goat', label: 'GOAT', description: 'Greatest Of All Time', color: 'bg-yellow-600' },
];

interface EditFormState {
  motto: string;
  avatar: string;
  donorGif: string;
  youtube: string;
  x: string;
  instagram: string;
}

const blankEditForm: EditFormState = {
  motto: '',
  avatar: '',
  donorGif: '',
  youtube: '',
  x: '',
  instagram: '',
};

export const AdminPanel: React.FC = () => {
  const {
    users,
    banRecords,
    adminBanActivity,
    adminBanRateLimits,
    ipBanRecords,
    multiAccountAlerts,
    banUser,
    unbanUser,
    assignDonorGif,
    removeDonorGif,
    getAdmins,
    promoteToAdmin,
    demoteAdmin,
    banIP,
    unbanIP,
    awardBadge,
    removeBadge,
    dismissMultiAccountAlert,
    currentUser,
    isOwner,
    canBanMoreUsers,
    applyHallOfShame,
    removeHallOfShame,
    getActiveHallOfShame,
    isUserInHallOfShame,
    refreshUsers,
    refreshBanRecords,
    editUserProfile,
  } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [banReason, setBanReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [donorGifUrl, setDonorGifUrl] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [ipToBan, setIpToBan] = useState('');
  const [ipBanReason, setIpBanReason] = useState('');
  const [hallOfShameReason, setHallOfShameReason] = useState('');
  const [hallOfShameDuration, setHallOfShameDuration] = useState<'24h' | '7d'>('24h');
  const [editForm, setEditForm] = useState<EditFormState>(blankEditForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Make sure we have a fresh user list / ban-records list when the panel loads
  useEffect(() => {
    refreshUsers().catch(() => {});
    refreshBanRecords().catch(() => {});
  }, [refreshUsers, refreshBanRecords]);

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============================================
  // CHANGED: include admins (and the owner if not me)
  // so admin badges + admin profiles are manageable here.
  // ============================================
  const manageableUsers = filteredUsers.filter(u => {
    if (u.id === currentUser?.id) return true;          // always show myself
    if (u.role === 'owner' && currentUser?.role !== 'owner') return false;
    return true;
  });

  const bannedUsers = filteredUsers.filter(u => u.isBanned);
  const adminUsers = getAdmins();

  const rateLimit = currentUser ? canBanMoreUsers(currentUser.id) : { allowed: false, remaining: 0, maxPerHour: 0 };

  const handleBanUser = async () => {
    if (selectedUser && banReason.trim()) {
      const result: any = await banUser(selectedUser.id, banReason);
      if (result?.success) {
        setBanReason('');
        setSelectedUser(null);
      } else {
        alert(result?.error || 'Failed to ban user');
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
  };

  const handleAssignDonor = async (userId: string, badgeUrl: string) => {
    await Promise.resolve(assignDonorGif(userId, badgeUrl));
    const tier = DONOR_BADGES.find(b => b.value === badgeUrl)?.tier;
    if (tier) {
      await awardBadge(userId, `donor_${tier}` as any, currentUser?.id);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => { await promoteToAdmin(userId); };
  const handleDemoteAdmin = async (userId: string) => { await demoteAdmin(userId); };

  const handleBanIP = () => {
    if (ipToBan.trim() && ipBanReason.trim()) {
      banIP(ipToBan.trim(), ipBanReason.trim());
      setIpToBan('');
      setIpBanReason('');
    }
  };

  const handleAssignBadge = async (userId: string, badgeType: 'vip' | 'mvp' | 'goat') => {
    const result: any = await awardBadge(userId, badgeType, currentUser?.id);
    if (result && result.success === false) {
      alert(result.error || 'Failed to award badge');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      motto: user.motto || '',
      avatar: user.avatar || '',
      donorGif: user.donorGif || '',
      youtube: user.socialMedia?.youtube || '',
      x: user.socialMedia?.x || '',
      instagram: user.socialMedia?.instagram || '',
    });
  };

  const saveEditedProfile = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    try {
      const result = await editUserProfile(editingUser.id, {
        motto: editForm.motto,
        avatar: editForm.avatar,
        donorGif: editForm.donorGif,
        socialMedia: {
          youtube: editForm.youtube || undefined,
          x: editForm.x || undefined,
          instagram: editForm.instagram || undefined,
        },
      } as any);
      if (result.success) {
        setEditingUser(null);
        setEditForm(blankEditForm);
      } else {
        alert(result.error || 'Failed to save profile');
      }
    } finally {
      setEditSaving(false);
    }
  };

  const renderBadge = (badge: UserBadge) => {
    const donorBadge = DONOR_BADGES.find(d => d.tier === badge.type.replace('donor_', ''));
    if (donorBadge) {
      return <img key={badge.id} src={donorBadge.value} alt={donorBadge.label} className="h-6 w-auto" />;
    }
    const specialBadge = ASSIGNABLE_BADGES.find(b => b.type === badge.type);
    if (specialBadge) {
      return <Badge key={badge.id} className={`${specialBadge.color} text-white`}>{specialBadge.label}</Badge>;
    }
    return <Badge key={badge.id} variant="secondary">{badge.type}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600 mt-2">
          Manage users, ban/unban accounts, edit profiles and view moderation history
        </p>
        {currentUser?.role === 'admin' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Rate Limit:</strong> You can ban {rateLimit.remaining} more users this hour
              (max {rateLimit.maxPerHour}/hour).
              {rateLimit.remaining === 0 && (
                <span className="text-red-600 block mt-1">
                  Rate limit reached! Contact the owner if you need to ban more users.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5" />
          How to Use Admin Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              How to Edit a User's Profile
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Find the user in "User Management"</li>
              <li>Click <strong>"Edit"</strong></li>
              <li>Change motto, avatar URL, donor GIF or social links</li>
              <li>Click "Save Changes"</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              <Info className="h-3 w-3 inline mr-1" />
              Owners can edit anyone (including other admins). Admins can edit regular users.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-600" />
              How to Ban a User
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Find the user, click red <strong>"Ban"</strong></li>
              <li>Enter a reason (required)</li>
              <li>Click "Ban User" — the ban is recorded with your name + timestamp</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              How to Unban a User
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Open the "Banned Users" tab</li>
              <li>Click <strong>"Unban"</strong> — the ban record is marked "Lifted"</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-purple-600" />
              How to Assign Donor / Special Badges
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Find the user in "User Management"</li>
              <li>Click <strong>"Add Donor"</strong> or <strong>"Badges"</strong></li>
              <li>Select tier / badge and confirm</li>
            </ol>
          </div>
        </div>
      </div>

      {isOwner() && multiAccountAlerts.length > 0 && (
        <Alert className="mb-6 border-orange-400 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-800">Multi-Account Alerts</AlertTitle>
          <AlertDescription className="text-orange-700">
            <div className="space-y-2 mt-2">
              {multiAccountAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <p className="font-medium">Users sharing IP: {alert.ipAddress}</p>
                    <p className="text-sm">
                      Accounts: {alert.userIds.map(id => users.find(u => u.id === id)?.username).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">Detected: {new Date(alert.detectedAt).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => dismissMultiAccountAlert(alert.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap">
          <TabsTrigger value="users"><Search className="h-4 w-4 mr-2" />User Management</TabsTrigger>
          <TabsTrigger value="banned"><Ban className="h-4 w-4 mr-2" />Banned Users ({bannedUsers.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Ban History</TabsTrigger>
          <TabsTrigger value="hall-of-shame"><Skull className="h-4 w-4 mr-2" />Hall of Shame</TabsTrigger>
          {isOwner() && (
            <>
              <TabsTrigger value="admins"><Crown className="h-4 w-4 mr-2" />Manage Admins</TabsTrigger>
              <TabsTrigger value="admin-activity"><Eye className="h-4 w-4 mr-2" />Admin Activity</TabsTrigger>
              <TabsTrigger value="ip-bans"><Globe className="h-4 w-4 mr-2" />IP Bans</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* User Management */}
        <TabsContent value="users">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <Label htmlFor="search">Search Users</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="search"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manageableUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.username}
                            {user.role === 'admin' && (
                              <Badge className="bg-red-600 text-white text-[10px]">Admin</Badge>
                            )}
                            {user.role === 'owner' && (
                              <Badge className="bg-purple-600 text-white text-[10px]">
                                <Crown className="h-3 w-3 mr-0.5" />Owner
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.lastLoginIP && (
                            <div className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                              IP: {user.lastLoginIP}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell>
                      {user.isBanned
                        ? <Badge className="bg-red-600 text-white">Banned</Badge>
                        : <Badge className="bg-green-600 text-white">Active</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.donorGif && <img src={user.donorGif} alt="Donor" className="h-5" />}
                        {user.badges?.slice(0, 3).map(badge => renderBadge(badge))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {/* Edit Profile */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          disabled={user.role === 'owner' && currentUser?.role !== 'owner'}
                        >
                          <Pencil className="h-4 w-4 mr-1" />Edit
                        </Button>

                        {/* Ban */}
                        {!user.isBanned && user.id !== currentUser?.id && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setSelectedUser(user)}>
                                <Ban className="h-4 w-4 mr-1" />Ban
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ban User: {user.username}</DialogTitle>
                                <DialogDescription>
                                  Enter a reason for banning this user. This will be saved in the ban records.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Label htmlFor="ban-reason">Ban Reason</Label>
                                <Input
                                  id="ban-reason"
                                  placeholder="Enter reason for ban..."
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleBanUser} disabled={!banReason.trim()}>
                                  Ban User
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Donor */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Gift className="h-4 w-4 mr-1" />
                              {user.donorGif ? 'Update Donor' : 'Add Donor'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Donor Badge: {user.username}</DialogTitle>
                              <DialogDescription>Select a donor tier to assign.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select onValueChange={setDonorGifUrl}>
                                <SelectTrigger><SelectValue placeholder="Select donor tier" /></SelectTrigger>
                                <SelectContent>
                                  {DONOR_BADGES.map(b => (
                                    <SelectItem key={b.value} value={b.value}>
                                      <div className="flex items-center gap-2">
                                        <img src={b.value} alt={b.label} className="h-5" />{b.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {user.donorGif && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-600 mb-1">Current badge:</p>
                                  <img src={user.donorGif} alt="Current donor badge" className="h-8" />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              {user.donorGif && (
                                <Button variant="destructive" onClick={() => removeDonorGif(user.id)}>
                                  Remove Donor
                                </Button>
                              )}
                              <Button onClick={() => handleAssignDonor(user.id, donorGifUrl)} disabled={!donorGifUrl}>
                                Assign Donor
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Badges */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Award className="h-4 w-4 mr-1" />Badges
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Badges: {user.username}</DialogTitle>
                              <DialogDescription>Award or remove special badges.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-2">Current Badges:</p>
                                <div className="flex flex-wrap gap-2">
                                  {user.badges?.length ? user.badges.map(badge => (
                                    <div key={badge.id} className="flex items-center gap-1">
                                      {renderBadge(badge)}
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeBadge(user.id, badge.id)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )) : <p className="text-sm text-gray-500">No badges</p>}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Award New Badge:</p>
                                <div className="flex gap-2">
                                  {ASSIGNABLE_BADGES.map(badge => (
                                    <Button
                                      key={badge.type}
                                      size="sm"
                                      className={badge.color}
                                      onClick={() => handleAssignBadge(user.id, badge.type as any)}
                                      disabled={user.badges?.some(b => b.type === badge.type)}
                                    >
                                      {badge.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Banned Users */}
        <TabsContent value="banned">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Banned Users</h2>
            {bannedUsers.length === 0 ? (
              <p className="text-gray-500">No banned users.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Ban Reason</TableHead>
                    <TableHead>Banned By</TableHead>
                    <TableHead>Banned Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.banReason || 'No reason provided'}</TableCell>
                      <TableCell>
                        {user.bannedByUsername ||
                         (user.bannedBy ? users.find(u => u.id === user.bannedBy)?.username : null) ||
                         'Unknown'}
                      </TableCell>
                      <TableCell>
                        {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>
                          <UserCheck className="h-4 w-4 mr-1" />Unban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Ban History */}
        <TabsContent value="history">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Ban History</h2>
            {banRecords.length === 0 ? (
              <p className="text-gray-500">No ban records.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Banned By</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell>{record.bannedByUsername || 'Unknown'}</TableCell>
                      <TableCell>{record.reason}</TableCell>
                      <TableCell>{new Date(record.bannedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.isActive
                          ? <Badge className="bg-red-600 text-white">Active</Badge>
                          : <Badge variant="secondary">Lifted</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Hall of Shame */}
        <TabsContent value="hall-of-shame">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Skull className="h-6 w-6 text-red-600" />
              Hall of Shame
            </h2>
            <p className="text-gray-600 mb-6">
              Apply Hall of Shame to users who have misbehaved. This will display a prominent badge on their profile and comments.
            </p>

            <div className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-lg font-medium mb-4 text-red-900">Apply Hall of Shame</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select User</Label>
                  <Select onValueChange={(value) => setSelectedUser(users.find(u => u.id === value) || null)}>
                    <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                    <SelectContent>
                      {users.filter(u => !u.isBanned && u.role !== 'owner' && !isUserInHallOfShame(u.id)).map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select value={hallOfShameDuration} onValueChange={(v: '24h' | '7d') => setHallOfShameDuration(v)}>
                    <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input placeholder="Enter reason..." value={hallOfShameReason} onChange={(e) => setHallOfShameReason(e.target.value)} />
                </div>
              </div>
              <Button
                className="mt-4 bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (selectedUser && hallOfShameReason.trim()) {
                    const result: any = await applyHallOfShame(selectedUser.id, hallOfShameReason, hallOfShameDuration);
                    if (result?.success) {
                      setSelectedUser(null);
                      setHallOfShameReason('');
                    } else {
                      alert(result?.error || 'Failed to apply Hall of Shame');
                    }
                  }
                }}
                disabled={!selectedUser || !hallOfShameReason.trim()}
              >
                <Skull className="h-4 w-4 mr-2" />Apply Hall of Shame
              </Button>
            </div>

            <h3 className="text-lg font-medium mb-4">Active Hall of Shame Entries</h3>
            {getActiveHallOfShame().length === 0 ? (
              <p className="text-gray-500">No active Hall of Shame entries.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied By</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getActiveHallOfShame().map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell>{record.reason}</TableCell>
                      <TableCell>{record.appliedByUsername}</TableCell>
                      <TableCell><Badge variant="secondary">{record.duration === '24h' ? '24 Hours' : '7 Days'}</Badge></TableCell>
                      <TableCell>{new Date(record.expiresAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => removeHallOfShame(record.userId)}>
                          <X className="h-4 w-4 mr-1" />Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Manage Admins (owner only) */}
        {isOwner() && (
          <TabsContent value="admins">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Manage Administrators</h2>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Admins</h3>
                {adminUsers.length === 0 ? (
                  <p className="text-gray-500">No admins yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Bans This Hour</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => {
                        const now = new Date();
                        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
                        const rl = adminBanRateLimits.find(a => a.adminId === admin.id && a.hourStart === hourStart);
                        const bansThisHour = rl?.banCount || 0;
                        return (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={admin.avatar} />
                                  <AvatarFallback>{admin.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{admin.username}</div>
                              </div>
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge className={bansThisHour >= 5 ? 'bg-red-600' : 'bg-green-600'}>
                                {bansThisHour} / 5
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" onClick={() => handleDemoteAdmin(admin.id)}>
                                Demote to User
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Promote User to Admin</h3>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => setSelectedUser(users.find(u => u.id === value) || null)}>
                    <SelectTrigger className="w-80"><SelectValue placeholder="Select a user to promote" /></SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'user').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => selectedUser && handlePromoteToAdmin(selectedUser.id)} disabled={!selectedUser} className="bg-blue-600">
                    <Crown className="h-4 w-4 mr-2" />Promote to Admin
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Admin Activity (owner only) */}
        {isOwner() && (
          <TabsContent value="admin-activity">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Ban Activity</h2>
              <p className="text-gray-600 mb-4">
                Track all ban actions performed by administrators for accountability.
              </p>
              {adminBanActivity.length === 0 ? (
                <p className="text-gray-500">No admin activity recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminBanActivity.slice().reverse().map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {users.find(u => u.id === activity.adminId)?.username || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge className={activity.action === 'ban' ? 'bg-red-600' : 'bg-green-600'}>
                            {activity.action === 'ban' ? 'Banned' : 'Unbanned'}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.targetUsername}</TableCell>
                        <TableCell>{activity.reason || '-'}</TableCell>
                        <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}

        {/* IP Bans (owner only) */}
        {isOwner() && (
          <TabsContent value="ip-bans">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">IP Ban Management</h2>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Ban IP Address</h3>
                <div className="flex gap-2">
                  <Input placeholder="Enter IP address" value={ipToBan} onChange={(e) => setIpToBan(e.target.value)} className="max-w-xs" />
                  <Input placeholder="Reason for ban" value={ipBanReason} onChange={(e) => setIpBanReason(e.target.value)} className="max-w-md" />
                  <Button onClick={handleBanIP} disabled={!ipToBan.trim() || !ipBanReason.trim()} variant="destructive">
                    <Ban className="h-4 w-4 mr-2" />Ban IP
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-3">Banned IP Addresses</h3>
              {ipBanRecords.filter(r => r.isActive).length === 0 ? (
                <p className="text-gray-500">No IP addresses banned.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipBanRecords.filter(r => r.isActive).map((ipBan) => (
                      <TableRow key={ipBan.id}>
                        <TableCell className="font-mono">{ipBan.ipAddress}</TableCell>
                        <TableCell>{ipBan.reason}</TableCell>
                        <TableCell>{users.find(u => u.id === ipBan.bannedBy)?.username || 'Unknown'}</TableCell>
                        <TableCell>{new Date(ipBan.bannedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => unbanIP(ipBan.ipAddress)}>
                            <UserCheck className="h-4 w-4 mr-1" />Unban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ============================================
          EDIT PROFILE DIALOG  (admin / owner)
          ============================================ */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile: {editingUser?.username}</DialogTitle>
            <DialogDescription>
              Update this user's motto, avatar, donor GIF or social links. Changes are saved to MongoDB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="edit-motto">Motto</Label>
              <Input
                id="edit-motto"
                value={editForm.motto}
                onChange={(e) => setEditForm(f => ({ ...f, motto: e.target.value }))}
                placeholder="A short personal motto"
              />
            </div>
            <div>
              <Label htmlFor="edit-avatar">Avatar URL</Label>
              <Input
                id="edit-avatar"
                value={editForm.avatar}
                onChange={(e) => setEditForm(f => ({ ...f, avatar: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label htmlFor="edit-donor">Donor GIF URL</Label>
              <Input
                id="edit-donor"
                value={editForm.donorGif}
                onChange={(e) => setEditForm(f => ({ ...f, donorGif: e.target.value }))}
                placeholder="https://… (or leave blank)"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="edit-yt">YouTube</Label>
                <Input id="edit-yt" value={editForm.youtube} onChange={(e) => setEditForm(f => ({ ...f, youtube: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-x">X (Twitter)</Label>
                <Input id="edit-x" value={editForm.x} onChange={(e) => setEditForm(f => ({ ...f, x: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-ig">Instagram</Label>
                <Input id="edit-ig" value={editForm.instagram} onChange={(e) => setEditForm(f => ({ ...f, instagram: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={editSaving}>Cancel</Button>
            <Button onClick={saveEditedProfile} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
