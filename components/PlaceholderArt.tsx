import React from 'react';

interface PlaceholderArtProps {
  name: string;
  type?: string;
  className?: string;
}

export const PlaceholderArt: React.FC<PlaceholderArtProps> = ({ name, type, className = "" }) => {
  // Simple hash function to get consistent colors/patterns for a name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-muted/30 ${className}`}>
      {/* Botanical Pattern Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="botanical-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 2 Q15 10 10 18 Q5 10 10 2" fill="currentColor" />
            <circle cx="5" cy="5" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#botanical-pattern)" />
      </svg>
      
      {/* Central Abstract Shape */}
      <div 
        className="w-24 h-24 rounded-full opacity-20 blur-2xl animate-pulse" 
        style={{ backgroundColor: `hsl(${hue}, 40%, 50%)` }} 
      />
      
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="font-display text-4xl font-bold italic opacity-10 select-none">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-30">
          {type || "Archive Record"}
        </span>
      </div>
    </div>
  );
};
