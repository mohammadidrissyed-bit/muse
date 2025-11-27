
import React from 'react';
import { Logo } from './Logo';

interface IntroAnimationProps {
  isVisible: boolean;
  onStart: () => void;
}

export function IntroAnimation({ isVisible, onStart }: IntroAnimationProps): React.ReactNode {
  return (
    <div
      className={`
        fixed inset-0 z-[100] flex flex-col items-center justify-center
        transition-opacity duration-1000 ease-in-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-80 h-80">
          {/* Ripples */}
          <div className="absolute inset-0 animate-intro-ripple border-2 border-cyan-400/50 rounded-full" style={{ animationDelay: '0s' }} />
          <div className="absolute inset-0 animate-intro-ripple border-2 border-violet-500/50 rounded-full" style={{ animationDelay: '0.8s' }} />
          
          {/* Progress Orbit */}
          <div className="absolute inset-[-10px] animate-intro-progress-orbit">
            <div className="w-full h-full border-t-2 border-b-2 border-white/30 rounded-full" />
          </div>

          {/* Pulsing Logo - animating the full word MUSE. Increased size. */}
          <div className="animate-intro-logo-pulse w-[90vw] max-w-[550px] flex justify-center">
              <Logo size="xxxxl" animateScope="word" />
          </div>
        </div>

        {/* Start Button - Removed border border-white/20 */}
        <button
          onClick={onStart}
          className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-semibold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-intro-text-reveal cursor-pointer z-50 pointer-events-auto"
          style={{ animationDelay: '1.5s' }}
        >
          Start Learning
        </button>
      </div>
    </div>
  );
}
