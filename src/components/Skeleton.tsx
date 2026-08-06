import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-surface rounded-3xl border border-border p-6 space-y-4 ${className}`}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-6 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-10 w-1/2" />
  </div>
);

export const SkeletonRow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 py-3 ${className}`}>
    <Skeleton className="w-11 h-11 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const SkeletonAvatar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <Skeleton className="w-[38px] h-[38px] rounded-full shrink-0" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
);
