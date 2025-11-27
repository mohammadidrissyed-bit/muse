import React from 'react';

interface ChapterDropdownProps {
  chapters: string[];
  selectedChapter: string | null;
  onSelectChapter: (chapter: string) => void;
  isLoading: boolean;
}

export function ChapterDropdown({ chapters, selectedChapter, onSelectChapter, isLoading }: ChapterDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      onSelectChapter(e.target.value);
    }
  };

  return (
    <div className="glass-panel bg-white/50 dark:bg-white/[.03] backdrop-blur-md rounded-2xl p-4 border border-black/5 dark:border-white/5">
      <label htmlFor="chapter-select" className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
        Chapter
      </label>
      <div className="relative">
        <select
          id="chapter-select"
          value={selectedChapter || ''}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="" disabled>Select a chapter...</option>
          {chapters.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
        </div>
      </div>
    </div>
  );
}