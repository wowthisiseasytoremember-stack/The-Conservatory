import React from 'react';

interface WireframePlaceholderProps {
  width?: string;
  height?: string;
  label?: string;
  aspectRatio?: string;
  pattern?: 'grid' | 'dots' | 'lines' | 'solid' | 'watercolor' | 'illustration';
  className?: string;
  variant?: 'card' | 'spread' | 'chart' | 'narrative';
}

/**
 * Wireframe placeholder component matching Nat Geo magazine aesthetic
 * Creates visual placeholders that feel structured and magazine-like, not spreadsheets
 * Inspired by botanical illustrations and field journal layouts
 */
export const WireframePlaceholder: React.FC<WireframePlaceholderProps> = ({
  width = '100%',
  height,
  label,
  aspectRatio,
  pattern = 'watercolor',
  className = '',
  variant = 'card'
}) => {
  const baseStyle: React.CSSProperties = {
    width,
    height: height || (aspectRatio ? undefined : '200px'),
    aspectRatio,
    borderRadius: variant === 'spread' ? '12px' : '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: variant === 'spread' 
      ? '1px solid rgba(148, 163, 184, 0.2)' 
      : '2px dashed rgba(148, 163, 184, 0.3)'
  };

  const patternStyles: Record<string, React.CSSProperties> = {
    grid: {
      backgroundImage: `
        linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px',
      backgroundColor: 'rgba(15, 23, 42, 0.2)'
    },
    dots: {
      backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1.5px, transparent 1.5px)',
      backgroundSize: '20px 20px',
      backgroundColor: 'rgba(15, 23, 42, 0.25)'
    },
    lines: {
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(148, 163, 184, 0.08) 12px, rgba(148, 163, 184, 0.08) 24px)',
      backgroundColor: 'rgba(15, 23, 42, 0.2)'
    },
    solid: {
      backgroundColor: 'rgba(15, 23, 42, 0.4)'
    },
    watercolor: {
      background: `
        radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.05) 0%, transparent 70%),
        rgba(15, 23, 42, 0.3)
      `,
      backgroundSize: '100% 100%, 100% 100%, 100% 100%'
    },
    illustration: {
      background: `
        linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
        linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at center, rgba(148, 163, 184, 0.1) 0%, transparent 70%),
        rgba(15, 23, 42, 0.25)
      `,
      backgroundImage: `
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(148, 163, 184, 0.03) 2px, rgba(148, 163, 184, 0.03) 4px)
      `
    }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    card: {
      padding: '1rem'
    },
    spread: {
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    chart: {
      padding: '0.5rem',
      borderTop: '2px solid rgba(148, 163, 184, 0.2)'
    },
    narrative: {
      padding: '1.5rem',
      fontStyle: 'italic'
    }
  };

  return (
    <div 
      style={{ ...baseStyle, ...patternStyles[pattern], ...variantStyles[variant] }}
      className={className}
    >
      {label && (
        <div className="text-center">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider block mb-1">
            {label}
          </span>
          {variant === 'illustration' && (
            <span className="text-[10px] text-slate-600 italic">
              (Draws in 2-3s)
            </span>
          )}
        </div>
      )}
      {/* Subtle texture overlay for magazine feel */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};
