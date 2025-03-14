import React from "react";

// SVG representation of the Pixelhunt logo icon based on the provided image
export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="currentColor"
    >
      {/* Custom SVG path based on the provided pixelated logo image */}
      <g>
        <rect x="0" y="0" width="100" height="100" />
        <rect x="410" y="0" width="102" height="100" />
        <rect x="200" y="200" width="100" height="100" />
        <rect x="400" y="200" width="112" height="100" />
        <rect x="300" y="300" width="100" height="100" />
        <rect x="0" y="400" width="200" height="112" />
        <rect x="400" y="400" width="112" height="112" />
      </g>
    </svg>
  );
}

// Full logo with text - use this when you need the logo + text
export function LogoWithText({ className = "h-8", textClassName = "font-bold text-xl" }: { 
  className?: string, 
  textClassName?: string 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Logo className={className} />
      <span className={`font-display tracking-wide ${textClassName}`}>Pixelhunt</span>
    </div>
  );
}
