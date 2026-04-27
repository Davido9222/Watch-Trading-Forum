// ============================================
// FORUM SECTION PAGE
// Displays threads in a specific forum section.
// Thread/post counts are read live from the forum store on every render
// (the previous version read section.threadCount which is a static `0`
// from the seed data, so leaf forums like Articles, Owners Threads,
// Manchester, Alabama, etc. always showed 0 even when threads existed).
// Sub-forum tiles also use live aggregated counts.
// ============================================

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { SortOption, TimeFilter } from '@/types';
import { Search, Plus, ArrowLeft, Lock } from 'lucide-react';

export const ForumSectionPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    getSectionBySlug,
    getSubsections,
    getThreadsBySection,
    getThreadsBySectionWithDescendants,
    getAggregatedThreadCount,
    getAggregatedPostCount,
    searchThreads
  } = useForumStore();
  const { isAuthenticated, currentUser } = useAuthStore();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const section = slug ? getSectionBySlug(slug) : undefined;
  const subsections = section ? getSubsections(section.id) : [];
  const hasSubsections = subsections.length > 0;

  const threads = section
    ? (hasSubsections
        ? getThreadsBySectionWithDescendants(section.id, sortBy, timeFilter)
        : getThreadsBySection(section.id, sortBy, timeFilter))
    : [];

  const searchResults = searchQuery.trim() && section
    ? (hasSubsections
        ? searchThreads(searchQuery).filter(t => {
            const { getAllDescendantSectionIds } = useForumStore.getState();
            const descendantIds = getAllDescendantSectionIds(section.id);
            return t.sectionId === section.id || descendantIds.includes(t.sectionId);
          })
        : searchThreads(searchQuery, section.id))
    : [];

  const displayThreads = searchQuery.trim() ? searchResults : threads;
  const canPost = isAuthenticated && (!section?.requiresOwner || currentUser?.role === 'owner');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(searchQuery.trim() !== '');
  };
  const clearSearch = () => { setSearchQuery(''); setIsSearching(false); };

  if (!section) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Section Not Found</h1>
          <p className="text-gray-600 mb-6">The forum section you're looking for doesn't exist.</p>
          <Link to="/"><Button><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  // Live counts for the section header — works for leaf and parent sections.
  const headerThreadCount = getAggregatedThreadCount(section.id);
  const headerPostCount = getAggregatedPostCount(section.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">{section.name}</span>
          </div>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{section.name}</h1>
              <p className="text-gray-600 mt-1">{section.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{headerThreadCount} threads</span>
                <span>{headerPostCount} posts</span>
                {section.requiresOwner && (
                  <Badge className="bg-purple-600 text-white">
                    <Lock className="h-3 w-3 mr-1" />Owner Only
                  </Badge>
                )}
              </div>
            </div>
            {canPost && (
              <Link to={`/new-thread/${section.slug}`}>
                <Button><Plus className="h-4 w-4 mr-2" />New Thread</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {subsections.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sub-forums</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subsections.map((sub) => {
                const displayThreadCount = getAggregatedThreadCount(sub.id);
                const displayPostCount = getAggregatedPostCount(sub.id);
                return (
                  <Link
                    key={sub.id}
                    to={`/forum/${sub.slug}`}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{sub.name}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {displayThreadCount} threads • {displayPostCount} posts
                      </div>
                    </div>
                    {sub.requiresOwner && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        <Lock className="h-3 w-3 mr-1" />Owner
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search thread titles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </form>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Time:</span>
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isSearching && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-600">Found {searchResults.length} results for "{searchQuery}"</span>
              <Button variant="ghost" size="sm" onClick={clearSearch}>Clear Search</Button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{isSearching ? 'Search Results' : 'Threads'}</h2>
          {displayThreads.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">{isSearching ? 'No threads found matching your search.' : 'No threads yet. Be the first to post!'}</p>
              {canPost && !isSearching && (
                <Link to={`/new-thread/${section.slug}`}>
                  <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Create First Thread</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayThreads.map((thread) => (<ThreadCard key={thread.id} thread={thread} />))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumSectionPage;
