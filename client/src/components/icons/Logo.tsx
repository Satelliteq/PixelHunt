import React from "react";

// SVG representation of the Pixelhunt logo icon
export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <>
      <img 
        src="/logo_black.svg" 
        alt="Pixelhunt Logo"
        className={`${className} dark:hidden`}
      />
      <img 
        src="/logo_white.svg" 
        alt="Pixelhunt Logo"
        className={`${className} hidden dark:block`}
      />
    </>
  );
}

// Inverted logo for dark mode backgrounds
export function LogoInverted({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img 
      src="/logo_white.svg" 
      alt="Pixelhunt Logo"
      className={className}
    />
  );
}

// Full logo with text - use this when you need the logo + text
export function LogoWithText({ className = "h-8", textClassName = "text-xl tracking-wide" }: { className?: string, textClassName?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={className}>
        <img 
          src="/logo_black.svg" 
          alt="Pixelhunt Logo"
          className="dark:hidden"
        />
        <img 
          src="/logo_white.svg" 
          alt="Pixelhunt Logo"
          className="hidden dark:block"
        />
      </div>
      <span className={`font-bold ${textClassName}`}>PixelHunt</span>
    </div>
  );
}

// Inverted logo with text for dark backgrounds
export function LogoWithTextInverted({ className = "h-8" }: { className?: string }) {
  return (
    <img 
      src="/logo_white.svg" 
      alt="Pixelhunt Logo"
      className={className}
    />
  );
}
