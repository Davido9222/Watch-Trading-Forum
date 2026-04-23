// ============================================
// ADMIN PANEL COMPONENT
// Backend section for admin/owner to manage users
// Includes: Ban/unban users, view ban records, assign donor GIFs, badges
// Owner features: Manage admins, view admin activity, IP bans, multi-account alerts
// ============================================

import React, { useState } from 'react';
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
  Crown, AlertTriangle, Globe, Award, X, Eye, Skull
} from 'lucide-react';

// Donor badge options
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

// Special badges that can be assigned by admin/owner
const ASSIGNABLE_BADGES = [
  { type: 'vip', label: 'VIP', description: 'Very Important Person', color: 'bg-purple-600' },
  { type: 'mvp', label: 'MVP', description: 'Most Valuable Player', color: 'bg-blue-600' },
  { type: 'goat', label: 'GOAT', description: 'Greatest Of All Time', color: 'bg-yellow-600' },
];

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
    isUserInHallOfShame
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

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get regular users (not admin/owner)
  const regularUsers = filteredUsers.filter(u => u.role === 'user');
  const bannedUsers = filteredUsers.filter(u => u.isBanned);
  const adminUsers = getAdmins();

  // Check rate limit
  const rateLimit = currentUser ? canBanMoreUsers(currentUser.id) : { allowed: false, remaining: 0, maxPerHour: 0 };

  // ============================================
  // HANDLE BAN USER
  // ============================================
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

  // ============================================
  // HANDLE UNBAN USER
  // ============================================
  const handleUnbanUser = async (userId: string) => {
    await unbanUser(userId);
  };

  // ============================================
  // HANDLE ASSIGN DONOR BADGE
  // ============================================
  const handleAssignDonor = async (userId: string, badgeUrl: string) => {
    await Promise.resolve(assignDonorGif(userId, badgeUrl));
    // Also award the corresponding badge
    const tier = DONOR_BADGES.find(b => b.value === badgeUrl)?.tier;
    if (tier) {
      await awardBadge(userId, `donor_${tier}` as any, currentUser?.id);
    }
  };

  // ============================================
  // HANDLE PROMOTE TO ADMIN
  // ============================================
  const handlePromoteToAdmin = async (userId: string) => {
    await promoteToAdmin(userId);
  };

  // ============================================
  // HANDLE DEMOTE ADMIN
  // ============================================
  const handleDemoteAdmin = async (userId: string) => {
    await demoteAdmin(userId);
  };

  // ============================================
  // HANDLE IP BAN
  // ============================================
  const handleBanIP = () => {
    if (ipToBan.trim() && ipBanReason.trim()) {
      banIP(ipToBan.trim(), ipBanReason.trim());
      setIpToBan('');
      setIpBanReason('');
    }
  };

  // ============================================
  // HANDLE ASSIGN SPECIAL BADGE
  // ============================================
  const handleAssignBadge = async (userId: string, badgeType: 'vip' | 'mvp' | 'goat') => {
    const result: any = await awardBadge(userId, badgeType, currentUser?.id);
    if (result && result.success === false) {
      alert(result.error || 'Failed to award badge');
    }
  };

  // ============================================
  // RENDER BADGE
  // ============================================
  const renderBadge = (badge: UserBadge) => {
    const donorBadge = DONOR_BADGES.find(d => d.tier === badge.type.replace('donor_', ''));
    if (donorBadge) {
      return (
        <img 
          key={badge.id} 
          src={donorBadge.value} 
          alt={donorBadge.label}
          className="h-6 w-auto"
        />
      );
    }
    
    const specialBadge = ASSIGNABLE_BADGES.find(b => b.type === badge.type);
    if (specialBadge) {
      return (
        <Badge key={badge.id} className={`${specialBadge.color} text-white`}>
          {specialBadge.label}
        </Badge>
      );
    }
    
    return (
      <Badge key={badge.id} variant="secondary">
        {badge.type}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600 mt-2">
          Manage users, ban/unban accounts, and view moderation history
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

      {/* Admin Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5" />
          How to Use Admin Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-600" />
              How to Ban a User
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to "User Management" tab</li>
              <li>Search for the user you want to ban</li>
              <li>Click the red <strong>"Ban"</strong> button</li>
              <li>Enter a reason for the ban (required)</li>
              <li>Click "Ban User" to confirm</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              <Info className="h-3 w-3 inline mr-1" />
              Rate limit: 5/hour for normal accounts, 100/hour for accounts under 30 days.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              How to Unban a User
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to "Banned Users" tab</li>
              <li>Find the banned user in the list</li>
              <li>Click the <strong>"Unban"</strong> button</li>
              <li>The user can now log in again</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-purple-600" />
              How to Assign Donor Status
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to "User Management" tab</li>
              <li>Find the user you want to reward</li>
              <li>Click <strong>"Add Donor"</strong> button</li>
              <li>Select the donor tier from dropdown</li>
              <li>Click "Assign Donor" to save</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-600" />
              How to Assign Special Badges
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to "User Management" tab</li>
              <li>Find the user</li>
              <li>Click <strong>"Manage Badges"</strong> button</li>
              <li>Select VIP, MVP, or GOAT badge</li>
              <li>Click "Award Badge" to save</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-blue-600" />
              How to Find & Ban IP Addresses
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Go to "User Management" tab</li>
              <li>Look for the <strong>"IP:"</strong> field under each user's email</li>
              <li>Copy the IP address you want to ban</li>
              <li>Go to "IP Bans" tab (Owner only)</li>
              <li>Paste the IP and enter a reason</li>
              <li>Click <strong>"Ban IP"</strong> to block all users from that IP</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              <Info className="h-3 w-3 inline mr-1" />
              IP bans prevent all users from that IP address from accessing the site.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Account Alerts (Owner Only) */}
      {isOwner() && multiAccountAlerts.length > 0 && (
        <Alert className="mb-6 border-orange-400 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-800">Multi-Account Alerts</AlertTitle>
          <AlertDescription className="text-orange-700">
            <div className="space-y-2 mt-2">
              {multiAccountAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div>
                    <p className="font-medium">
                      Users sharing IP: {alert.ipAddress}
                    </p>
                    <p className="text-sm">
                      Accounts: {alert.userIds.map(id => users.find(u => u.id === id)?.username).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Detected: {new Date(alert.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => dismissMultiAccountAlert(alert.id)}
                  >
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
          <TabsTrigger value="users">
            <Search className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="banned">
            <Ban className="h-4 w-4 mr-2" />
            Banned Users ({bannedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Ban History
          </TabsTrigger>
          <TabsTrigger value="hall-of-shame">
            <Skull className="h-4 w-4 mr-2" />
            Hall of Shame
          </TabsTrigger>
          {isOwner() && (
            <>
              <TabsTrigger value="admins">
                <Crown className="h-4 w-4 mr-2" />
                Manage Admins
              </TabsTrigger>
              <TabsTrigger value="admin-activity">
                <Eye className="h-4 w-4 mr-2" />
                Admin Activity
              </TabsTrigger>
              <TabsTrigger value="ip-bans">
                <Globe className="h-4 w-4 mr-2" />
                IP Bans
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* User Management Tab */}
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
                {regularUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.lastLoginIP && (
                            <div className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                              IP: {user.lastLoginIP}
                            </div>
                          )}
                          {user.knownIPs && user.knownIPs.length > 1 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {user.knownIPs.length} known IPs
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge className="bg-red-600 text-white">Banned</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.donorGif && (
                          <img src={user.donorGif} alt="Donor" className="h-5" />
                        )}
                        {user.badges?.slice(0, 3).map(badge => renderBadge(badge))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {/* Ban Dialog */}
                        {!user.isBanned && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
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
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleBanUser}
                                  disabled={!banReason.trim()}
                                >
                                  Ban User
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Donor Badge Dialog */}
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
                              <DialogDescription>
                                Select a donor tier to assign to this user.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Select onValueChange={(value) => setDonorGifUrl(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select donor tier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DONOR_BADGES.map((badge) => (
                                    <SelectItem key={badge.value} value={badge.value}>
                                      <div className="flex items-center gap-2">
                                        <img src={badge.value} alt={badge.label} className="h-5" />
                                        {badge.label}
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
                                <Button 
                                  variant="destructive" 
                                  onClick={() => removeDonorGif(user.id)}
                                >
                                  Remove Donor
                                </Button>
                              )}
                              <Button 
                                onClick={() => handleAssignDonor(user.id, donorGifUrl)}
                                disabled={!donorGifUrl}
                              >
                                Assign Donor
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Special Badges Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Award className="h-4 w-4 mr-1" />
                              Badges
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Badges: {user.username}</DialogTitle>
                              <DialogDescription>
                                Award or remove special badges for this user.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-2">Current Badges:</p>
                                <div className="flex flex-wrap gap-2">
                                  {user.badges?.length ? (
                                    user.badges.map(badge => (
                                      <div key={badge.id} className="flex items-center gap-1">
                                        {renderBadge(badge)}
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => removeBadge(user.id, badge.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">No badges</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Award New Badge:</p>
                                <div className="flex gap-2">
                                  {ASSIGNABLE_BADGES.map((badge) => (
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

                        {/* Quick Ban IP (Owner Only) */}
                        {isOwner() && user.lastLoginIP && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                <Globe className="h-4 w-4 mr-1" />
                                Ban IP
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ban IP Address</DialogTitle>
                                <DialogDescription>
                                  Ban IP <code className="bg-gray-100 px-1 rounded">{user.lastLoginIP}</code> associated with user {user.username}.
                                  This will prevent anyone from this IP from accessing the site.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Label htmlFor="ip-ban-reason">Ban Reason</Label>
                                <Input
                                  id="ip-ban-reason"
                                  placeholder="Enter reason for IP ban..."
                                  value={ipBanReason}
                                  onChange={(e) => setIpBanReason(e.target.value)}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIpBanReason('')}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => {
                                    if (user.lastLoginIP && ipBanReason.trim()) {
                                      banIP(user.lastLoginIP, ipBanReason);
                                      setIpBanReason('');
                                    }
                                  }}
                                  disabled={!ipBanReason.trim()}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban This IP
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* View Recovery Phrase (Owner Only) */}
                        {isOwner() && user.recoveryPhrase && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Recovery Phrase: {user.username}</DialogTitle>
                                <DialogDescription className="text-red-600">
                                  This is sensitive information. Only share with the account owner.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <code className="bg-gray-100 p-4 rounded-lg block text-center text-lg">
                                  {user.recoveryPhrase}
                                </code>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Banned Users Tab */}
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
                        {user.bannedBy ? 
                          users.find(u => u.id === user.bannedBy)?.username || 'Unknown' 
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Ban History Tab */}
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
                      <TableCell>{record.bannedByUsername}</TableCell>
                      <TableCell>{record.reason}</TableCell>
                      <TableCell>{new Date(record.bannedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.isActive ? (
                          <Badge className="bg-red-600 text-white">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Lifted</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Hall of Shame Tab */}
        <TabsContent value="hall-of-shame">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Skull className="h-6 w-6 text-red-600" />
              Hall of Shame
            </h2>
            <p className="text-gray-600 mb-6">
              Apply Hall of Shame to users who have misbehaved. This will display a prominent badge on their profile and comments.
            </p>
            
            {/* Apply Hall of Shame Section */}
            <div className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-lg font-medium mb-4 text-red-900">Apply Hall of Shame</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select User</Label>
                  <Select onValueChange={(value) => setSelectedUser(users.find(u => u.id === value) || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => !u.isBanned && u.role !== 'owner' && !isUserInHallOfShame(u.id)).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select value={hallOfShameDuration} onValueChange={(value: '24h' | '7d') => setHallOfShameDuration(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Hours</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input
                    placeholder="Enter reason..."
                    value={hallOfShameReason}
                    onChange={(e) => setHallOfShameReason(e.target.value)}
                  />
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
                <Skull className="h-4 w-4 mr-2" />
                Apply Hall of Shame
              </Button>
            </div>

            {/* Active Hall of Shame List */}
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
                      <TableCell>
                        <Badge variant="secondary">{record.duration === '24h' ? '24 Hours' : '7 Days'}</Badge>
                      </TableCell>
                      <TableCell>{new Date(record.expiresAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeHallOfShame(record.userId)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Manage Admins Tab (Owner Only) */}
        {isOwner() && (
          <TabsContent value="admins">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Manage Administrators</h2>
              
              {/* Current Admins */}
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
                        const rateLimit = adminBanRateLimits.find(a => a.adminId === admin.id && a.hourStart === hourStart);
                        const bansThisHour = rateLimit?.banCount || 0;
                        
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
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDemoteAdmin(admin.id)}
                              >
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

              {/* Promote User to Admin */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Promote User to Admin</h3>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => setSelectedUser(users.find(u => u.id === value) || null)}>
                    <SelectTrigger className="w-80">
                      <SelectValue placeholder="Select a user to promote" />
                    </SelectTrigger>
                    <SelectContent>
                      {regularUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => selectedUser && handlePromoteToAdmin(selectedUser.id)}
                    disabled={!selectedUser}
                    className="bg-blue-600"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Promote to Admin
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Admin Activity Tab (Owner Only) */}
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

        {/* IP Bans Tab (Owner Only) */}
        {isOwner() && (
          <TabsContent value="ip-bans">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">IP Ban Management</h2>
              
              {/* Ban New IP */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Ban IP Address</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    value={ipToBan}
                    onChange={(e) => setIpToBan(e.target.value)}
                    className="max-w-xs"
                  />
                  <Input
                    placeholder="Reason for ban"
                    value={ipBanReason}
                    onChange={(e) => setIpBanReason(e.target.value)}
                    className="max-w-md"
                  />
                  <Button 
                    onClick={handleBanIP}
                    disabled={!ipToBan.trim() || !ipBanReason.trim()}
                    variant="destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban IP
                  </Button>
                </div>
              </div>

              {/* Banned IPs List */}
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
                        <TableCell>
                          {users.find(u => u.id === ipBan.bannedBy)?.username || 'Unknown'}
                        </TableCell>
                        <TableCell>{new Date(ipBan.bannedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => unbanIP(ipBan.ipAddress)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unban
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
    </div>
  );
};

export default AdminPanel;
