import React from "react";
import { useTheme } from "next-themes";

// SVG representation of the Pixelhunt logo icon with 4 blocks
export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill={isDark ? "white" : "black"}
    >
      {/* Simple 4-block grid */}
      <g>
        <rect x="0" y="0" width="45" height="45" />
        <rect x="55" y="0" width="45" height="45" />
        <rect x="0" y="55" width="45" height="45" />
        <rect x="55" y="55" width="45" height="45" />
      </g>
    </svg>
  );
}

// Inverted logo for dark mode backgrounds
export function LogoInverted({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="white"
    >
      {/* Simple 4-block grid */}
      <g>
        <rect x="0" y="0" width="45" height="45" />
        <rect x="55" y="0" width="45" height="45" />
        <rect x="0" y="55" width="45" height="45" />
        <rect x="55" y="55" width="45" height="45" />
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
    <div className="flex items-center space-x-2">
      <Logo className={className} />
      <span className={`font-bold tracking-wide ${textClassName}`}>
        Pixelhunt
      </span>
    </div>
  );
}

// Inverted logo with text for dark backgrounds
export function LogoWithTextInverted({ className = "h-8", textClassName = "text-xl" }: { 
  className?: string, 
  textClassName?: string 
}) {
  return (
    <div className="flex items-center space-x-2">
      <LogoInverted className={className} />
      <span className={`font-bold tracking-wide text-white ${textClassName}`}>
        Pixelhunt
      </span>
    </div>
  );
}
