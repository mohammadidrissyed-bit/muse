import React from 'react';

export function LoadingSpinner(): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-10 h-10 border-4 border-t-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-center">Generating...</p>
    </div>
  );
}

const SkeletonLine = ({ className }: { className?: string }) => (
    <div className={`bg-slate-200 dark:bg-slate-800 rounded ${className || ''} transition-colors`} />
);

export const TopicListSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse transition-colors duration-300">
        <SkeletonLine className="h-3 w-1/4 mb-4" /> 
        <div className="space-y-2">
            <SkeletonLine className="h-9 w-full" />
            <SkeletonLine className="h-9 w-full" />
            <SkeletonLine className="h-9 w-5/6" />
            <SkeletonLine className="h-9 w-full" />
        </div>
    </div>
);

// FIX: Added and exported TopicDropdownSkeleton to fix the import error in TopicDropdown.tsx.
export const TopicDropdownSkeleton = () => (
    <div className="relative animate-pulse">
        <SkeletonLine className="w-full h-12 rounded-lg" />
    </div>
);

export const GeneratedContentSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 animate-pulse transition-colors duration-300">
        {/* Title skeleton */}
        <SkeletonLine className="h-6 w-1/3 mb-4" />

        {/* Content skeleton */}
        <div className="space-y-3">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-5/6" />
            <SkeletonLine className="h-4 w-full" />
            <div className="pt-2"></div>
            <SkeletonLine className="h-4 w-4/5" />
            <SkeletonLine className="h-4 w-full" />
            <div className="pt-2"></div>
            <SkeletonLine className="h-24 w-full" />
        </div>
    </div>
);