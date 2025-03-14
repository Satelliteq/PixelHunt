import React from "react";

// SVG representation of the Pixelhunt logo icon based on the provided image
export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Grid-based pixelated logo */}
      <g>
        {/* Top row */}
        <rect x="0" y="0" width="120" height="120" />
        <rect x="392" y="0" width="120" height="120" />
        
        {/* Middle section */}
        <rect x="196" y="196" width="120" height="120" />
        <rect x="392" y="196" width="120" height="120" />
        <rect x="294" y="294" width="120" height="120" />
        
        {/* Bottom row */}
        <rect x="0" y="392" width="220" height="120" />
        <rect x="392" y="392" width="120" height="120" />
      </g>
    </svg>
  );
}

// Full logo with text - use this when you need the logo + text
export function LogoWithText({ className = "h-8", textClassName = "text-xl" }: { 
  className?: string, 
  textClassName?: string 
}) {
  return (
    <div className="flex items-center space-x-3">
      <Logo className={className} />
      <span className={`font-display text-theme-primary tracking-wider ${textClassName}`}>
        PIXELHUNT
      </span>
    </div>
  );
}
