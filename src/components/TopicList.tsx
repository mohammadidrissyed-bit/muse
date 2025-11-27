import React from 'react';
import { TopicListSkeleton } from './LoadingSpinner';

interface TopicListProps {
  topics: string[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string) => void;
  isLoading: boolean;
  noMoreTopics: boolean;
  onLoadMore: () => void;
  selectedChapter: string | null;
}

export function TopicList({ topics, selectedTopic, onSelectTopic, isLoading, noMoreTopics, onLoadMore, selectedChapter }: TopicListProps) {
  if (!selectedChapter) {
    return null; // Don't show if no chapter is selected
  }
  
  // Show skeleton only when loading and the list is completely empty
  if (isLoading && topics.length === 0) {
    return <TopicListSkeleton />;
  }

  return (
    <div className="glass-panel bg-white/50 dark:bg-white/[.03] backdrop-blur-md rounded-2xl p-4 animate-fade-in border border-black/5 dark:border-white/5">
      <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
        Topics
      </h3>
      <div className="relative">
        <ul className="space-y-1.5 max-h-[calc(100vh-30rem)] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
          {topics.map((topic, index) => (
            <li
              key={topic}
              className="animate-stagger-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => onSelectTopic(topic)}
                className={`w-full text-left p-2.5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500
                  ${selectedTopic === topic
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {topic}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {!noMoreTopics && (
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-wait"
          >
            {isLoading ? 'Loading...' : 'Load More Topics'}
          </button>
        </div>
      )}
    </div>
  );
}