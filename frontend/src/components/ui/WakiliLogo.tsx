import React from 'react';
import { colors } from '../../styles/designSystem';

interface WakiliLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export const WakiliLogo: React.FC<WakiliLogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const dimensions = {
    sm: { width: 120, height: 32, iconSize: 28, fontSize: '14px' },
    md: { width: 160, height: 40, iconSize: 36, fontSize: '18px' },
    lg: { width: 200, height: 48, iconSize: 44, fontSize: '22px' },
    xl: { width: 240, height: 56, iconSize: 52, fontSize: '26px' }
  };

  const { width, height, iconSize, fontSize } = dimensions[size];

  // Elegant Scales of Justice Icon
  const ScalesIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      {/* Central pillar */}
      <rect
        x="11.5"
        y="4"
        width="1"
        height="16"
        fill="url(#pillarGradient)"
        rx="0.5"
      />
      
      {/* Base */}
      <rect
        x="8"
        y="19"
        width="8"
        height="1.5"
        fill="url(#baseGradient)"
        rx="0.75"
      />
      
      {/* Cross beam */}
      <rect
        x="6"
        y="7.5"
        width="12"
        height="0.8"
        fill="url(#beamGradient)"
        rx="0.4"
      />
      
      {/* Left scale plate */}
      <ellipse
        cx="8"
        cy="12"
        rx="3"
        ry="0.8"
        fill="url(#plateGradient)"
        stroke={colors.primary[600]}
        strokeWidth="0.3"
      />
      
      {/* Right scale plate */}
      <ellipse
        cx="16"
        cy="12"
        rx="3"
        ry="0.8"
        fill="url(#plateGradient)"
        stroke={colors.primary[600]}
        strokeWidth="0.3"
      />
      
      {/* Left chain */}
      <path
        d="M8 8.3 L8 11.2"
        stroke={colors.secondary[500]}
        strokeWidth="0.4"
        fill="none"
      />
      
      {/* Right chain */}
      <path
        d="M16 8.3 L16 11.2"
        stroke={colors.secondary[500]}
        strokeWidth="0.4"
        fill="none"
      />
      
      {/* Crown/Top ornament */}
      <circle
        cx="12"
        cy="4"
        r="1.5"
        fill="url(#crownGradient)"
        stroke={colors.secondary[600]}
        strokeWidth="0.2"
      />
      
      <path
        d="M10.8 3.2 L12 2.5 L13.2 3.2"
        stroke={colors.secondary[600]}
        strokeWidth="0.3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gradients */}
      <defs>
        <linearGradient id="pillarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.primary[600]} />
          <stop offset="100%" stopColor={colors.primary[500]} />
        </linearGradient>
        
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.gray[600]} />
          <stop offset="100%" stopColor={colors.gray[500]} />
        </linearGradient>
        
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.secondary[600]} />
          <stop offset="50%" stopColor={colors.secondary[500]} />
          <stop offset="100%" stopColor={colors.secondary[600]} />
        </linearGradient>
        
        <radialGradient id="plateGradient" cx="50%" cy="30%">
          <stop offset="0%" stopColor={colors.gray[100]} />
          <stop offset="100%" stopColor={colors.gray[200]} />
        </radialGradient>
        
        <radialGradient id="crownGradient" cx="50%" cy="30%">
          <stop offset="0%" stopColor={colors.secondary[400]} />
          <stop offset="100%" stopColor={colors.secondary[500]} />
        </radialGradient>
        
        {/* Soft glow effect */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <ScalesIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: colors.primary[700],
            fontFamily: '-apple-system, BlinkMacSystemFont, San Francisco, sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          Wakili Pro
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center space-x-3 ${className}`}
      style={{ width, height }}
    >
      <ScalesIcon />
      <div className="flex flex-col justify-center">
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color: colors.primary[700],
            fontFamily: '-apple-system, BlinkMacSystemFont, San Francisco, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}
        >
          Wakili Pro
        </span>
        <span
          style={{
            fontSize: `calc(${fontSize} * 0.6)`,
            fontWeight: 500,
            color: colors.gray[600],
            fontFamily: '-apple-system, BlinkMacSystemFont, San Francisco, sans-serif',
            letterSpacing: '0.02em',
            lineHeight: 1,
            marginTop: '2px'
          }}
        >
          Legal Excellence
        </span>
      </div>
    </div>
  );
};

export default WakiliLogo;