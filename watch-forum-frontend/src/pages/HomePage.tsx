// ============================================
// HOME PAGE
// Main landing page showing all forum sections
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useLanguageStore } from '@/stores/languageStore';
import { SectionCard } from '@/components/forum/SectionCard';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { getMainSections, getSubsections, threads } = useForumStore();
  const { getAllUsers, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();

  const mainSections = getMainSections();
  const allUsers = getAllUsers();

  // REAL Stats calculated from actual data
  const totalUsers = allUsers.filter(u => !u.isBanned).length;
  const totalThreads = threads.length;
  const totalPosts = threads.reduce((sum, t) => sum + t.commentCount, 0) + totalThreads;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative flex items-center gap-4">
              <img 
                src="/logo-home.png" 
                alt="Watch" 
                className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-2xl"
              />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
                  Watch Trading Forums
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xl text-center text-blue-100 max-w-2xl mx-auto mb-8">
            The premier community for watch enthusiasts to buy, sell, trade, and discuss timepieces from around the world
          </p>
          
          {!isAuthenticated && (
            <div className="flex justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold">
                  Join Community
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-slate-900 font-semibold"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          STATS BAR
          ============================================ */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-gray-600">{totalUsers.toLocaleString()} {t('nav.members')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-gray-600">{totalThreads.toLocaleString()} {t('forum.threads')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-gray-600">{totalPosts.toLocaleString()} {t('forum.posts')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-gray-600">{new Date().toLocaleDateString()} Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          FORUM SECTIONS
          ============================================ */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.forum')}</h2>
        
        <div className="space-y-4">
          {mainSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              subsections={getSubsections(section.id)}
            />
          ))}
        </div>
      </div>

      {/* ============================================
          QUICK LINKS
          ============================================ */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/forum/new-member-introductions" className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-gray-900">New Member?</h3>
              <p className="text-sm text-gray-600 mt-1">Introduce yourself</p>
            </Link>
            <Link to="/forum/community-rules" className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Community Rules</h3>
              <p className="text-sm text-gray-600 mt-1">Read before posting</p>
            </Link>
            <Link to="/forum/rolex-watches" className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Rolex</h3>
              <p className="text-sm text-gray-600 mt-1">Discuss Rolex watches</p>
            </Link>
            <Link to="/forum/post-your-watch-images" className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Share Photos</h3>
              <p className="text-sm text-gray-600 mt-1">Post your collection</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
