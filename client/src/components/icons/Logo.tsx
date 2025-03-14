import React from "react";

// SVG representation of the Logo icon based on the provided image
export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
    >
      {/* Custom SVG path based on the provided logo image */}
      <path d="M128 96h256v320H128V96zm32 32v64h64v-64h-64zm0 96v64h64v-64h-64zm0 96v64h64v-64h-64zm192-192v64h-64v-64h64zm0 96v64h-64v-64h64zm0 96v64h-64v-64h64z" />
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
