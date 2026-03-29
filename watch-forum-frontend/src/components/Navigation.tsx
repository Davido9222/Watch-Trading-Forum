// ============================================
// NAVIGATION COMPONENT
// Main navigation bar with user menu and translations
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useLanguageStore } from '@/stores/languageStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Shield, Menu, X, Mail, Users, Gamepad2, Newspaper, MessageSquare, Bell, VolumeX } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

// Logo Component - Uses user's full logo with text (transparent background)
const LogoIcon: React.FC<{ className?: string }> = ({ className = "h-10" }) => (
  <img 
    src="/logo-nav.png" 
    alt="Watch Trading Forums" 
    className={`${className} object-contain`}
  />
);

// ============================================
// NOTIFICATION BELL COMPONENT
// Shows unread notifications with dropdown
// ============================================
const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { 
    getUserNotifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead,
    muteThread,
    unmuteThread,
    isThreadMuted
  } = useNotificationStore();
  
  if (!currentUser) return null;
  
  const notifications = getUserNotifications(currentUser.id);
  const unreadCount = getUnreadCount(currentUser.id);
  
  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <p className="font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsRead(currentUser.id)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer ${
                !notification.isRead ? 'bg-blue-50/50' : ''
              }`}
            >
              <div onClick={() => handleNotificationClick(notification)}>
                <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(notification.createdAt)}
                </p>
              </div>
              
              {/* Mute thread option for thread replies */}
              {notification.type === 'thread_reply' && notification.threadId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isThreadMuted(currentUser.id, notification.threadId!)) {
                      unmuteThread(currentUser.id, notification.threadId!);
                    } else {
                      muteThread(currentUser.id, notification.threadId!);
                    }
                  }}
                  className="mt-2 text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700"
                >
                  {isThreadMuted(currentUser.id, notification.threadId) ? (
                    <>
                      <Bell className="h-3 w-3" />
                      Unmute thread
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-3 w-3" />
                      Mute thread
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout, canModerate } = useAuthStore();
  const { getUnreadCount } = useMessageStore();
  const { t } = useLanguageStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <LogoIcon />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/forum/watch-discussion-forum" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t('nav.forum')}
            </Link>
            <Link to="/forum/marketplace" className="text-gray-600 hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/members" className="text-gray-600 hover:text-blue-600 transition-colors">
              {t('nav.members')}
            </Link>
            <Link to="/blog" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Newspaper className="h-4 w-4" />
              {t('nav.blog')}
            </Link>
            <Link to="/shoutbox" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Shoutbox
            </Link>
            <Link to="/play-flappy-watch" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" />
              {t('nav.game')}
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Notification Bell */}
            {isAuthenticated && currentUser && <NotificationBell />}
            
            {isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{currentUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block font-medium text-gray-700">
                      {currentUser.username}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium">{currentUser.username}</p>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profile/${currentUser.username}`)}>
                    <User className="h-4 w-4 mr-2" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('nav.messages')}
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-red-600 text-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/members')}>
                    <Users className="h-4 w-4 mr-2" />
                    {t('nav.members')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/play-flappy-watch')}>
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    {t('nav.game')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profile/${currentUser.username}`)}>
                    <Settings className="h-4 w-4 mr-2" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  {canModerate() && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      {t('nav.admin')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button>{t('nav.register')}</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Link 
                to="/" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to="/forum/watch-discussion-forum" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.forum')}
              </Link>
              <Link 
                to="/forum/marketplace" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                to="/members" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                {t('nav.members')}
              </Link>
              <Link 
                to="/blog" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Newspaper className="h-4 w-4" />
                {t('nav.blog')}
              </Link>
              <Link 
                to="/shoutbox" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                Shoutbox
              </Link>
              <Link 
                to="/play-flappy-watch" 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Gamepad2 className="h-4 w-4" />
                {t('nav.game')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
