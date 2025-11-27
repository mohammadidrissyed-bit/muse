import React from 'react';
import { SUBJECTS, STANDARDS, CHAPTERS } from '../constants';
import type { Subject, Standard } from '../types';

interface CourseSelectorProps {
  onSelectCourse: (subject: Subject, standard: Standard) => void;
  isLoading: boolean;
}

interface CourseCardProps {
    subject: Subject;
    standard: Standard;
    onSelect: () => void;
    disabled: boolean;
}
const CourseCard: React.FC<CourseCardProps> = ({ subject, standard, onSelect, disabled }) => (
    <button
        onClick={onSelect}
        disabled={disabled}
        className="w-full text-left p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed button-glow-hover"
    >
        <p className="font-semibold text-slate-800 dark:text-slate-100">{subject}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{standard}</p>
    </button>
);

export function CourseSelector({ onSelectCourse, isLoading }: CourseSelectorProps) {
  return (
    <div className="glass-panel bg-white/50 dark:bg-white/[.03] backdrop-blur-md rounded-2xl p-4 animate-fade-in border border-black/5 dark:border-white/5">
      <h2 className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider mb-4">
        Select Your Course
      </h2>
      <div className="space-y-3">
        {SUBJECTS.map(subject => (
            <div key={subject}>
                {STANDARDS.map(standard => {
                    // Check if there are chapters defined for this subject-standard combination
                    if (CHAPTERS[subject]?.[standard]) {
                        return (
                            <CourseCard 
                                key={`${subject}-${standard}`}
                                subject={subject}
                                standard={standard}
                                onSelect={() => onSelectCourse(subject, standard)}
                                disabled={isLoading}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        ))}
      </div>
    </div>
  );
}