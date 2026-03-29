// ============================================
// MAIN APP COMPONENT
// Routes and app structure
// ============================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { HomePage } from '@/pages/HomePage';
import { ForumSectionPage } from '@/pages/ForumSectionPage';
import { ThreadPage } from '@/pages/ThreadPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NewThreadPage } from '@/pages/NewThreadPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { MembersPage } from '@/pages/MembersPage';
import { FlappyWatchPage } from '@/pages/FlappyWatchPage';
import { BlogListPage } from '@/pages/BlogListPage';
import { BlogPostPage } from '@/pages/BlogPostPage';
import { BlogEditorPage } from '@/pages/BlogEditorPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ShoutboxPage } from '@/pages/ShoutboxPage';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { FallingWatchesEasterEgg } from '@/components/FallingWatchesEasterEgg';
import { useAuthStore } from '@/stores/authStore';
import { useForumStore } from '@/stores/forumStore';
import { useMessageStore } from '@/stores/messageStore';

// ============================================
// PROTECTED ROUTE COMPONENT
// Requires authentication
// ============================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// ============================================
// ADMIN ROUTE COMPONENT
// Requires admin or owner role
// ============================================
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, canModerate } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!canModerate()) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// ============================================
// OWNER ROUTE COMPONENT
// Requires owner role only
// ============================================
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isOwner } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isOwner()) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// ============================================
// MAIN APP
// ============================================
function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeForum = useForumStore((s) => s.initialize);
  const initializeMessages = useMessageStore((s) => s.initialize);

  useEffect(() => {
    initializeAuth();
    initializeForum();
    initializeMessages();
  }, [initializeAuth, initializeForum, initializeMessages]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Easter Egg - Falling Watches */}
        <FallingWatchesEasterEgg />
        
        <Navigation />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/forum/:slug" element={<ForumSectionPage />} />
            <Route path="/thread/:threadId" element={<ThreadPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/shoutbox" element={<ShoutboxPage />} />
            <Route path="/play-flappy-watch" element={<FlappyWatchPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            {/* Multilingual blog routes for SEO */}
            <Route path="/blog/:lang/:slug" element={<BlogPostPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/new-thread/:sectionSlug" 
              element={
                <ProtectedRoute>
                  <NewThreadPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages/:username" 
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
            
            {/* Owner Routes - Blog Management */}
            <Route 
              path="/blog/new" 
              element={
                <OwnerRoute>
                  <BlogEditorPage />
                </OwnerRoute>
              } 
            />
            <Route 
              path="/blog/edit/:slug" 
              element={
                <OwnerRoute>
                  <BlogEditorPage />
                </OwnerRoute>
              } 
            />
            {/* Handle language-prefixed edit URLs */}
            <Route 
              path="/blog/edit/:lang/:slug" 
              element={
                <OwnerRoute>
                  <BlogEditorPage />
                </OwnerRoute>
              } 
            />
            
            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} Watch Trading Forums. All rights reserved.
              </div>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="text-gray-600 hover:text-blue-600">Privacy Policy</a>
                <a href="#" className="text-gray-600 hover:text-blue-600">Terms of Service</a>
                <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
