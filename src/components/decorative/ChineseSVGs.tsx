import React from 'react';

// Cloud ornament inspired by Chinese ruyi clouds
export const CloudOrnament: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`cloud-ornament ${className}`}
    width="36"
    height="18"
    viewBox="0 0 36 18"
    fill="none"
  >
    <path
      d="M2 14 Q6 8 10 12 Q12 6 16 10 Q18 4 22 8 Q24 2 28 6 Q30 4 34 8"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M4 16 Q8 11 12 14 Q14 9 18 12 Q20 7 24 10 Q26 7 30 11"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
  </svg>
);

// Lotus ornament
export const LotusOrnament: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M12 20 C12 20 8 16 8 12 C8 9 10 7 12 7 C14 7 16 9 16 12 C16 16 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path
      d="M12 20 C12 20 6 15 5 11 C4 8 7 5 10 6 C11 6.5 12 7 12 7 C12 7 13 6.5 14 6 C17 5 20 8 19 11 C18 15 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M12 20 C12 20 4 14 3 9 C2 5 6 3 9 4.5 C10 5 11 6 12 7 C13 6 14 5 15 4.5 C18 3 22 5 21 9 C20 14 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="currentColor"
      fillOpacity="0.07"
    />
    <line
      x1="12"
      y1="20"
      x2="12"
      y2="22"
      stroke="currentColor"
      strokeWidth="0.8"
    />
    <path
      d="M9 22 Q12 20 15 22"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="none"
    />
  </svg>
);

// Chinese geometric corner ornament
export const CornerOrnament: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  position: 'tl' | 'tr' | 'bl' | 'br';
}> = ({ className = '', position, style }) => {
  const transforms = {
    tl: '',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  };

  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      style={{ transform: transforms[position], ...style }}
    >
      <path
        d="M2 2 L16 2 L16 4 L4 4 L4 16 L2 16 Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M6 6 L12 6 L12 8 L8 8 L8 12 L6 12 Z"
        fill="currentColor"
        opacity="0.3"
      />
      <rect x="18" y="2" width="2" height="4" fill="currentColor" opacity="0.3" />
      <rect x="2" y="18" width="4" height="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
};

// Red seal / chop ornament
export const SealOrnament: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
  >
    <rect
      x="2"
      y="2"
      width="16"
      height="16"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path
      d="M6 7 L10 13 L14 7"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M8 10 L12 10"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
  </svg>
);

// Decorative divider line with center ornament
export const GoldDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-yellow-700/30" />
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="2" fill="rgba(200,169,110,0.5)" />
      <circle cx="6" cy="6" r="4" stroke="rgba(200,169,110,0.3)" strokeWidth="0.5" fill="none" />
    </svg>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-yellow-700/30" />
  </div>
);

// Mountains silhouette SVG for sidebar
export const MountainSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red sun/moon */}
    <circle cx="200" cy="60" r="35" fill="#8b1a1a" opacity="0.85" />
    <circle cx="200" cy="60" r="33" fill="#6b1414" opacity="0.6" />

    {/* Far mountains - lightest */}
    <path
      d="M0 160 L30 100 L60 130 L90 90 L120 110 L150 70 L180 100 L210 80 L240 105 L270 75 L280 90 L280 200 L0 200 Z"
      fill="#1a1a20"
      opacity="0.5"
    />

    {/* Mid mountains */}
    <path
      d="M0 180 L20 130 L50 155 L80 120 L110 145 L140 100 L170 130 L200 110 L230 140 L260 120 L280 135 L280 200 L0 200 Z"
      fill="#141418"
      opacity="0.7"
    />

    {/* Pagoda */}
    <g transform="translate(50, 120)" opacity="0.7">
      {/* Base */}
      <rect x="8" y="45" width="24" height="4" fill="#c8a96e" opacity="0.4" />
      {/* Body levels */}
      <rect x="10" y="35" width="20" height="12" fill="#c8a96e" opacity="0.25" />
      <path d="M7 35 L20 28 L33 35 Z" fill="#c8a96e" opacity="0.35" />
      <rect x="12" y="25" width="16" height="12" fill="#c8a96e" opacity="0.2" />
      <path d="M9 25 L20 18 L31 25 Z" fill="#c8a96e" opacity="0.3" />
      <rect x="14" y="16" width="12" height="10" fill="#c8a96e" opacity="0.15" />
      <path d="M11 16 L20 10 L29 16 Z" fill="#c8a96e" opacity="0.25" />
      {/* Spire */}
      <line x1="20" y1="10" x2="20" y2="4" stroke="#c8a96e" strokeWidth="1" opacity="0.4" />
      {/* Eaves lines */}
      <line x1="5" y1="35" x2="35" y2="35" stroke="#c8a96e" strokeWidth="0.5" opacity="0.2" />
      <line x1="7" y1="25" x2="33" y2="25" stroke="#c8a96e" strokeWidth="0.5" opacity="0.2" />
      <line x1="9" y1="16" x2="31" y2="16" stroke="#c8a96e" strokeWidth="0.5" opacity="0.2" />
    </g>

    {/* Red maple tree */}
    <g transform="translate(180, 80)" opacity="0.85">
      {/* Trunk */}
      <path d="M12 80 Q10 60 8 40 Q11 30 12 20" stroke="#3d2010" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Branches */}
      <path d="M10 45 Q5 35 0 30" stroke="#3d2010" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 38 Q18 28 24 22" stroke="#3d2010" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 30 Q0 20 -5 14" stroke="#3d2010" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Red leaves clusters */}
      <circle cx="12" cy="18" r="10" fill="#8b1a1a" opacity="0.7" />
      <circle cx="0" cy="26" r="8" fill="#8b1a1a" opacity="0.65" />
      <circle cx="24" cy="18" r="9" fill="#8b1a1a" opacity="0.6" />
      <circle cx="-5" cy="12" r="7" fill="#8b1a1a" opacity="0.55" />
      <circle cx="18" cy="10" r="6" fill="#a02020" opacity="0.5" />
      <circle cx="6" cy="8" r="5" fill="#8b1a1a" opacity="0.6" />

      {/* Falling leaves */}
      <ellipse cx="-10" cy="50" rx="3" ry="5" fill="#8b1a1a" opacity="0.5" transform="rotate(-30 -10 50)" />
      <ellipse cx="28" cy="55" rx="2" ry="4" fill="#8b1a1a" opacity="0.4" transform="rotate(20 28 55)" />
      <ellipse cx="5" cy="65" rx="2" ry="4" fill="#8b1a1a" opacity="0.3" transform="rotate(-15 5 65)" />
    </g>

    {/* Foreground dark mountains */}
    <path
      d="M0 200 L0 170 L15 155 L35 170 L55 145 L75 165 L100 140 L120 160 L140 135 L160 158 L180 170 L200 165 L220 175 L240 165 L260 175 L280 170 L280 200 Z"
      fill="#0d0d0f"
      opacity="0.9"
    />

    {/* Mist layers */}
    <rect x="0" y="155" width="280" height="20" fill="url(#mistGradient)" opacity="0.3" />
    <rect x="0" y="130" width="280" height="15" fill="url(#mistGradient)" opacity="0.15" />

    <defs>
      <linearGradient id="mistGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a3040" stopOpacity="0" />
        <stop offset="50%" stopColor="#3a3040" stopOpacity="1" />
        <stop offset="100%" stopColor="#3a3040" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

// Reader background landscape
export const ReaderLandscape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 400 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Large red moon */}
    <circle cx="200" cy="150" r="70" fill="#6b1414" opacity="0.6" />
    <circle cx="200" cy="150" r="65" fill="#8b1a1a" opacity="0.4" />
    <circle cx="200" cy="150" r="60" fill="#a01f1f" opacity="0.25" />

    {/* Far mountains */}
    <path
      d="M0 350 L50 220 L100 270 L150 180 L200 230 L250 160 L300 210 L350 175 L400 200 L400 600 L0 600Z"
      fill="#1a1520"
      opacity="0.6"
    />

    {/* Mid mountains */}
    <path
      d="M0 420 L40 310 L80 360 L120 290 L170 340 L210 270 L250 320 L290 280 L340 330 L400 300 L400 600 L0 600Z"
      fill="#140f18"
      opacity="0.75"
    />

    {/* Pagoda on mountain */}
    <g transform="translate(240, 250)" opacity="0.5">
      <rect x="8" y="60" width="24" height="5" fill="#c8a96e" />
      <rect x="10" y="48" width="20" height="14" fill="#c8a96e" opacity="0.7" />
      <path d="M6 48 L20 40 L34 48Z" fill="#c8a96e" opacity="0.8" />
      <rect x="12" y="36" width="16" height="14" fill="#c8a96e" opacity="0.6" />
      <path d="M8 36 L20 28 L32 36Z" fill="#c8a96e" opacity="0.7" />
      <rect x="14" y="25" width="12" height="13" fill="#c8a96e" opacity="0.5" />
      <path d="M10 25 L20 17 L30 25Z" fill="#c8a96e" opacity="0.6" />
      <line x1="20" y1="17" x2="20" y2="10" stroke="#c8a96e" strokeWidth="1.5" opacity="0.7" />
    </g>

    {/* Red maple tree left */}
    <g transform="translate(20, 180)" opacity="0.7">
      <path d="M15 200 Q13 160 10 120 Q12 100 15 80" stroke="#2d1508" strokeWidth="4" fill="none" />
      <path d="M12 130 Q4 110 0 95" stroke="#2d1508" strokeWidth="2.5" fill="none" />
      <path d="M12 110 Q22 90 28 75" stroke="#2d1508" strokeWidth="2" fill="none" />

      <circle cx="15" cy="75" r="22" fill="#6b1414" opacity="0.7" />
      <circle cx="-2" cy="90" r="18" fill="#6b1414" opacity="0.65" />
      <circle cx="30" cy="70" r="16" fill="#7a1818" opacity="0.6" />
      <circle cx="8" cy="58" r="14" fill="#6b1414" opacity="0.55" />
      <circle cx="25" cy="55" r="12" fill="#8b1a1a" opacity="0.5" />

      <ellipse cx="-15" cy="160" rx="4" ry="7" fill="#6b1414" opacity="0.4" transform="rotate(-25 -15 160)" />
      <ellipse cx="35" cy="170" rx="3" ry="6" fill="#6b1414" opacity="0.35" transform="rotate(20 35 170)" />
    </g>

    {/* Red maple tree right upper */}
    <g transform="translate(340, 220)" opacity="0.6">
      <path d="M10 150 Q8 120 6 90 Q8 75 10 60" stroke="#2d1508" strokeWidth="3" fill="none" />
      <path d="M8 100 Q2 82 0 70" stroke="#2d1508" strokeWidth="2" fill="none" />
      <path d="M8 85 Q16 68 20 56" stroke="#2d1508" strokeWidth="1.5" fill="none" />

      <circle cx="10" cy="55" r="18" fill="#6b1414" opacity="0.65" />
      <circle cx="-2" cy="68" r="14" fill="#6b1414" opacity="0.6" />
      <circle cx="22" cy="52" r="12" fill="#7a1818" opacity="0.55" />
      <circle cx="5" cy="42" r="10" fill="#6b1414" opacity="0.5" />
    </g>

    {/* Mist layers */}
    <path
      d="M0 380 Q100 360 200 375 Q300 390 400 370 L400 410 Q300 430 200 415 Q100 400 0 420Z"
      fill="#1f1520"
      opacity="0.4"
    />
    <path
      d="M0 420 Q80 405 160 415 Q240 425 320 410 Q360 405 400 415 L400 450 Q360 445 320 450 Q240 465 160 455 Q80 445 0 460Z"
      fill="#1a1020"
      opacity="0.35"
    />

    {/* Foreground dark */}
    <path
      d="M0 550 L0 480 L50 460 L100 475 L150 450 L200 465 L250 445 L300 460 L350 448 L400 455 L400 600 L0 600Z"
      fill="#0a090c"
      opacity="0.95"
    />
  </svg>
);

// Featured card background landscape
export const FeaturedCardBg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 800 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMid slice"
  >
    {/* Large red sun */}
    <circle cx="680" cy="80" r="65" fill="#6b1414" opacity="0.7" />
    <circle cx="680" cy="80" r="58" fill="#8b1a1a" opacity="0.5" />
    <circle cx="680" cy="80" r="50" fill="#a01f1f" opacity="0.3" />

    {/* Far mountains */}
    <path
      d="M300 180 L380 110 L430 140 L480 90 L530 120 L580 70 L630 100 L680 75 L730 95 L780 70 L800 80 L800 220 L300 220Z"
      fill="#1e1218"
      opacity="0.65"
    />

    {/* Mid mountains / pagoda landscape */}
    <path
      d="M400 220 L440 165 L470 180 L500 148 L535 170 L560 140 L600 165 L640 145 L680 158 L720 150 L760 160 L800 155 L800 220Z"
      fill="#18100e"
      opacity="0.8"
    />

    {/* Pagoda */}
    <g transform="translate(585, 110)" opacity="0.65">
      <rect x="8" y="45" width="24" height="5" fill="#c8a96e" />
      <rect x="10" y="34" width="20" height="13" fill="#c8a96e" opacity="0.7" />
      <path d="M6 34 L20 26 L34 34Z" fill="#c8a96e" opacity="0.8" />
      <rect x="12" y="24" width="16" height="12" fill="#c8a96e" opacity="0.6" />
      <path d="M8 24 L20 16 L32 24Z" fill="#c8a96e" opacity="0.7" />
      <rect x="14" y="15" width="12" height="11" fill="#c8a96e" opacity="0.5" />
      <path d="M10 15 L20 8 L30 15Z" fill="#c8a96e" opacity="0.6" />
      <line x1="20" y1="8" x2="20" y2="3" stroke="#c8a96e" strokeWidth="1.5" opacity="0.7" />
    </g>

    {/* Red maple branches top right */}
    <g transform="translate(700, 0)" opacity="0.75">
      <path d="M50 0 Q45 20 40 45 Q35 60 30 80" stroke="#3d1508" strokeWidth="3" fill="none" />
      <path d="M42 35 Q30 30 22 35" stroke="#3d1508" strokeWidth="2" fill="none" />
      <path d="M38 55 Q48 50 55 55" stroke="#3d1508" strokeWidth="1.5" fill="none" />
      <path d="M32 70 Q20 65 12 70" stroke="#3d1508" strokeWidth="1.5" fill="none" />

      <circle cx="40" cy="32" r="16" fill="#6b1414" opacity="0.7" />
      <circle cx="22" cy="32" r="13" fill="#7a1818" opacity="0.65" />
      <circle cx="55" cy="52" r="11" fill="#6b1414" opacity="0.6" />
      <circle cx="12" cy="68" r="13" fill="#7a1818" opacity="0.6" />
      <circle cx="30" cy="22" r="10" fill="#8b1a1a" opacity="0.55" />

      {/* Falling leaves */}
      <ellipse cx="15" cy="120" rx="3" ry="5" fill="#7a1818" opacity="0.5" transform="rotate(-30 15 120)" />
      <ellipse cx="60" cy="130" rx="2" ry="4" fill="#7a1818" opacity="0.4" transform="rotate(25 60 130)" />
      <ellipse cx="35" cy="145" rx="2" ry="4" fill="#7a1818" opacity="0.35" transform="rotate(-10 35 145)" />
    </g>

    {/* Chinese geometric ornament top right corner */}
    <g transform="translate(750, 8)" opacity="0.35">
      <rect x="0" y="0" width="40" height="40" rx="1" stroke="#c8a96e" strokeWidth="0.5" fill="none" />
      <rect x="4" y="4" width="32" height="32" rx="1" stroke="#c8a96e" strokeWidth="0.3" fill="none" />
      <line x1="8" y1="0" x2="8" y2="8" stroke="#c8a96e" strokeWidth="0.5" />
      <line x1="0" y1="8" x2="8" y2="8" stroke="#c8a96e" strokeWidth="0.5" />
      <line x1="32" y1="0" x2="32" y2="8" stroke="#c8a96e" strokeWidth="0.5" />
      <line x1="32" y1="8" x2="40" y2="8" stroke="#c8a96e" strokeWidth="0.5" />
      <line x1="8" y1="40" x2="8" y2="32" stroke="#c8a96e" strokeWidth="0.5" />
      <line x1="0" y1="32" x2="8" y2="32" stroke="#c8a96e" strokeWidth="0.5" />
    </g>

    {/* Mist */}
    <path
      d="M400 160 Q500 150 600 158 Q700 166 800 155 L800 185 Q700 196 600 188 Q500 180 400 190Z"
      fill="#2a1520"
      opacity="0.4"
    />

    {/* Dark foreground */}
    <path
      d="M400 220 L450 200 L500 210 L550 196 L600 208 L650 198 L700 205 L750 196 L800 202 L800 220Z"
      fill="#0d0a0e"
      opacity="0.8"
    />
  </svg>
);
