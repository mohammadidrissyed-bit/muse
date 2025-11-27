
import React from 'react';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onOpenMenu: () => void;
    logoVisible: boolean;
}

export function Header({ 
    theme, onToggleTheme, onOpenMenu, logoVisible
}: HeaderProps): React.ReactNode {

  return (
    <header className="sticky top-0 z-30 bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 border-b border-black/[0.06] dark:border-white/[0.05]">
          <div className="flex items-center md:hidden">
            <button
                onClick={onOpenMenu}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 icon-glow-hover"
                aria-label="Open menu"
            >
                <HamburgerIcon />
            </button>
          </div>
          {/* Empty div for spacing balance on desktop */}
          <div className="hidden md:flex w-10" />

          <div
            className={`
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center
              transition-opacity duration-500 ease-in-out
              ${logoVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
             {/* Using Kaushan Script for that Avallon-like brush feel. Increased size for impact. */}
            <h1 className="text-5xl font-script text-slate-800 dark:text-white tracking-wide">muse</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
                onClick={onToggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 icon-glow-hover"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
