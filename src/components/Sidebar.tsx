

import React, { useEffect, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Made children prop optional to resolve TypeScript error.
  children?: React.ReactNode;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scroll only on mobile when sidebar is an overlay
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'; 
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop (Mobile Only) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* 
        Sidebar Panel
        - On mobile (default): A fixed overlay that translates in/out of view.
        - On desktop (md:): Always visible, fixed, with a set width.
      */}
      <aside
        ref={sidebarRef}
        className={`
          glass-sidebar sidebar-glow
          fixed top-0 left-0 h-full w-[80%] max-w-[320px] z-50 
          bg-white/50 dark:bg-white/[.03] backdrop-blur-[18px]
          border-r border-black/[0.06] dark:border-white/[0.05]
          transition-transform duration-300 ease-in-out transform
          rounded-r-2xl
          md:w-[320px] md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 h-16 flex-shrink-0 border-b border-black/[0.06] dark:border-white/[0.05]">
                <h2 id="sidebar-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Menu</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
                    aria-label="Close menu"
                >
                    <CloseIcon />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {children}
            </div>
        </div>
      </aside>
    </>
  );
}