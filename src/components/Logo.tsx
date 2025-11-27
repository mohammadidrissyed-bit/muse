import React, { useId } from "react";

type Size = "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "xxxxl";
type Layout = "icon" | "full";
type AnimateScope = "icon" | "word";

interface LogoProps {
  size?: Size;
  className?: string;
  layout?: Layout;
  animateScope?: AnimateScope;
}

const sizeMap: Record<Size, number> = {
  sm: 20,
  md: 30,
  lg: 50,
  xl: 80,
  xxl: 120,
  xxxl: 160,
  xxxxl: 200,
};

const stars = Array.from({ length: 70 }, (_, i) => ({
  key: `star-${i}`,
  cx: Math.random() * 500, // Wide spread for the text
  cy: Math.random() * 200,
  r: Math.random() * 1.2 + 0.3,
  opacity: Math.random() * 0.5 + 0.5,
}));

export function Logo({ size = "md", className = "", layout = "full", animateScope = "word" }: LogoProps) {
  const uniqueId = useId();
  const height = sizeMap[size];
  // Aspect ratio for "muse" in Kaushan Script is roughly 2.5:1
  const width = height * 2.5; 

  return (
    <div
      className={className}
      aria-label="muse logo"
      role="img"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        maxWidth: '100%', 
        // Maintain aspect ratio if width is constrained
        aspectRatio: '2.5 / 1',
        display: "inline-flex", 
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        viewBox="0 0 500 200"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`cosmic-grad-muse-${uniqueId}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="25%" stopColor="#facc15" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* The text used for masking */}
          <text 
            id={`text-muse-brush-${uniqueId}`}
            x="50%" 
            y="55%" 
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily="'Satisfy', cursive"
            fontSize="190"
            fontWeight="normal"
            letterSpacing="2"
          >
            muse
          </text>

          {/* Clip Path based on the text */}
          <clipPath id={`muse-clip-${uniqueId}`}>
             <use href={`#text-muse-brush-${uniqueId}`} />
          </clipPath>
        </defs>
        
        {/* Render Logic */}
        
        {/* Background clipped to text shape */}
        <g clipPath={`url(#muse-clip-${uniqueId})`}>
             {/* Gradient Fill */}
             <rect x="0" y="0" width="500" height="200" fill={`url(#cosmic-grad-muse-${uniqueId})`} />
             
             {/* Drifting Stars Animation */}
             <g className="stars-drift">
                  {stars.map(s => <circle key={s.key} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.opacity} />)}
                  {stars.map(s => <circle key={`${s.key}-clone`} cx={s.cx} cy={s.cy + 200} r={s.r} fill="white" opacity={s.opacity} />)}
              </g>

              {/* Twinkling stars overlay - strategically placed over letters */}
              <path d="M90 110 L94 104 L98 110 L94 116 Z" fill="white" className="star-flicker" style={{ animationDelay: '0s' }} />
              <path d="M200 85 L204 79 L208 85 L204 91 Z" fill="white" className="star-flicker" style={{ animationDelay: '0.3s' }} />
              <path d="M310 120 L314 114 L318 120 L314 126 Z" fill="white" className="star-flicker" style={{ animationDelay: '0.7s' }} />
              <path d="M420 70 L424 64 L428 70 L424 76 Z" fill="white" className="star-flicker" style={{ animationDelay: '1.1s' }} />
        </g>
      </svg>
    </div>
  );
}