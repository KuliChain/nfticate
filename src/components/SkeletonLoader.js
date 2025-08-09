import { useState, useEffect } from "react";

// Reusable Skeleton Loading Components
export const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-slate-200 rounded w-16"></div>
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-4/5"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="h-4 bg-slate-200 rounded w-12"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="animate-pulse">
      {/* Table Header */}
      <div className="bg-slate-50 px-6 py-3">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-4/5"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-slate-200 rounded w-16"></div>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
                <div className="h-8 bg-slate-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-3 bg-slate-200 rounded w-16 mb-3"></div>
              <div className="h-8 bg-slate-200 rounded w-12"></div>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonPage = ({ hasStats = true, hasTable = false, hasCards = true }) => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded w-32"></div>
      </div>
    </div>

    {/* Stats Skeleton */}
    {hasStats && <SkeletonStats />}

    {/* Search/Filter Skeleton */}
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="animate-pulse">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-200 rounded w-20"></div>
            ))}
          </div>
          <div className="h-10 bg-slate-200 rounded w-64"></div>
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    {hasTable && <SkeletonTable />}
    {hasCards && <SkeletonList />}
  </div>
);

// Loading Hook untuk minimum loading time
export const useConsistentLoading = (isLoading, minLoadingTime = 400) => {
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    let timeoutId;
    
    if (isLoading) {
      // Reset ke loading state
      setShowLoading(true);
    } else {
      // Set minimum loading time
      timeoutId = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, minLoadingTime]);
  
  return showLoading || isLoading;
};