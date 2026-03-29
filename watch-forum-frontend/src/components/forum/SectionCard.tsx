// ============================================
// SECTION CARD COMPONENT
// Displays forum section with subforums
// Used for main forum sections that contain subforums
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import type { ForumSection } from '@/types';
import { ChevronRight, Folder, MessageSquare } from 'lucide-react';

interface SectionCardProps {
  section: ForumSection;
  subsections: ForumSection[];
}

// ============================================
// FORMAT DATE
// ============================================
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No posts yet';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const SectionCard: React.FC<SectionCardProps> = ({ section, subsections }) => {
  const { getAggregatedThreadCount, getAggregatedPostCount, getSubsections, threads } = useForumStore();
  
  // For sections with subsections, use aggregated counts
  // For leaf sections (no subsections), calculate from actual threads
  const hasSubsections = subsections.length > 0;
  
  // Calculate actual thread count for this section from threads array
  const actualThreadCount = threads.filter(t => t.sectionId === section.id).length;
  const actualPostCount = actualThreadCount + threads
    .filter(t => t.sectionId === section.id)
    .reduce((sum, t) => sum + t.commentCount, 0);
  
  const threadCount = hasSubsections 
    ? getAggregatedThreadCount(section.id) 
    : actualThreadCount;
  const postCount = hasSubsections 
    ? getAggregatedPostCount(section.id) 
    : actualPostCount;
  
  // If section is clickable and has no subsections, link directly
  if (section.isClickable && subsections.length === 0) {
    return (
      <Link 
        to={`/forum/${section.slug}`}
        className="block bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md hover:border-blue-300 transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{section.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{threadCount} threads</span>
                <span>{postCount} posts</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
        
        {section.lastPostAt && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Last post: {formatDate(section.lastPostAt)} by {section.lastPostBy}
          </div>
        )}
      </Link>
    );
  }

  // Section with subsections
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Section Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Folder className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            {section.isClickable ? (
              <Link to={`/forum/${section.slug}`}>
                <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{section.name}</h3>
              </Link>
            ) : (
              <h3 className="font-semibold text-gray-900">{section.name}</h3>
            )}
            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            {/* Show aggregated counts for parent sections */}
            {hasSubsections && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{threadCount} threads</span>
                <span>{postCount} posts</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subsections Grid */}
      {subsections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {subsections.map((sub) => {
            // Check if this subsection has nested subsections (e.g., Belgium's Flanders/Wallonia)
            const nestedSubs = getSubsections(sub.id);
            const hasNestedSubs = nestedSubs.length > 0;
            
            // Calculate actual thread count for this subsection from threads array
            const subActualThreadCount = threads.filter(t => t.sectionId === sub.id).length;
            const subActualPostCount = subActualThreadCount + threads
              .filter(t => t.sectionId === sub.id)
              .reduce((sum, t) => sum + t.commentCount, 0);
            
            // Use aggregated counts for subsections with children, actual counts for leaf subsections
            const subThreadCount = hasNestedSubs 
              ? getAggregatedThreadCount(sub.id) 
              : subActualThreadCount;
            const subPostCount = hasNestedSubs 
              ? getAggregatedPostCount(sub.id) 
              : subActualPostCount;
            
            return (
              <Link
                key={sub.id}
                to={`/forum/${sub.slug}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all"
              >
                <div>
                  <span className="font-medium text-gray-800 hover:text-blue-600">{sub.name}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {subThreadCount} threads • {subPostCount} posts
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Last Post Info */}
      {section.lastPostAt && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          Last post: {formatDate(section.lastPostAt)} by {section.lastPostBy}
        </div>
      )}
    </div>
  );
};

export default SectionCard;
