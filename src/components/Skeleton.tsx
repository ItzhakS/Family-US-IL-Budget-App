import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps & { lines?: number }> = ({
  className = '',
  lines = 1,
}) => {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
};

export const SkeletonChart: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
      aria-hidden="true"
    >
      <Skeleton className="mb-4 h-3 w-32" />
      <div className="flex items-end justify-around gap-2 h-48">
        {[40, 65, 35, 80, 55, 45, 70, 50, 60, 45, 75, 55].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<SkeletonProps & { rows?: number }> = ({
  className = '',
  rows = 5,
}) => {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<SkeletonProps & { rows?: number; cols?: number }> = ({
  className = '',
  rows = 5,
  cols = 4,
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800 ${className}`}
      aria-hidden="true"
    >
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" role="status" aria-label="Loading dashboard">
      <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <div className="col-span-2">
            <SkeletonCard className="!p-6" />
          </div>
        </div>
        <SkeletonChart className="h-72" />
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-4 h-3 w-24" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <div className="col-span-2">
            <SkeletonCard className="!p-6" />
          </div>
        </div>
        <SkeletonChart className="h-72" />
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-4 h-3 w-24" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <SkeletonList rows={5} />
      </div>
    </div>
  );
};

export const MaaserSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" role="status" aria-label="Loading ma'aser tracker">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
          <SkeletonTable rows={4} cols={3} />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <SkeletonList rows={4} />
    </div>
  );
};

export const RecurringSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" role="status" aria-label="Loading recurring bills">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-7 w-24" />
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
