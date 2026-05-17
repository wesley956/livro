export function DragonOrnament({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M10 40 Q30 10 60 40 Q90 70 110 40" stroke="rgba(200,169,110,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M10 50 Q30 20 60 50 Q90 80 110 50" stroke="rgba(200,169,110,0.12)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <circle cx="60" cy="40" r="3" fill="rgba(200,169,110,0.3)"/>
      <circle cx="20" cy="42" r="2" fill="rgba(200,169,110,0.2)"/>
      <circle cx="100" cy="38" r="2" fill="rgba(200,169,110,0.2)"/>
    </svg>
  );
}

export function LotusOrnament({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M30 50 Q20 40 20 30 Q20 20 30 15 Q40 20 40 30 Q40 40 30 50Z" stroke="rgba(200,169,110,0.3)" strokeWidth="1" fill="rgba(200,169,110,0.05)"/>
      <path d="M30 50 Q10 38 12 25 Q18 15 30 15 Q15 25 30 50Z" stroke="rgba(200,169,110,0.2)" strokeWidth="0.8" fill="rgba(200,169,110,0.03)"/>
      <path d="M30 50 Q50 38 48 25 Q42 15 30 15 Q45 25 30 50Z" stroke="rgba(200,169,110,0.2)" strokeWidth="0.8" fill="rgba(200,169,110,0.03)"/>
      <circle cx="30" cy="30" r="4" fill="rgba(200,169,110,0.2)"/>
      <line x1="30" y1="50" x2="30" y2="58" stroke="rgba(200,169,110,0.2)" strokeWidth="1"/>
    </svg>
  );
}

export function CornerOrnament({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const transforms = {
    tl: 'rotate(0)',
    tr: 'rotate(90)',
    bl: 'rotate(270)',
    br: 'rotate(180)',
  };
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      style={{ transform: transforms[position], opacity: 0.4 }}
      aria-hidden="true"
    >
      <path d="M2 2 L18 2 L18 4 L4 4 L4 18 L2 18 Z" fill="rgba(200,169,110,0.5)"/>
      <path d="M6 6 L14 6 L14 8 L8 8 L8 14 L6 14 Z" fill="rgba(200,169,110,0.3)"/>
      <circle cx="10" cy="10" r="1.5" fill="rgba(200,169,110,0.4)"/>
    </svg>
  );
}

export function WavePattern() {
  return (
    <svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M0 20 Q50 5 100 20 Q150 35 200 20 Q250 5 300 20 Q350 35 400 20" stroke="rgba(200,169,110,0.15)" strokeWidth="1" fill="none"/>
      <path d="M0 25 Q50 10 100 25 Q150 40 200 25 Q250 10 300 25 Q350 40 400 25" stroke="rgba(200,169,110,0.08)" strokeWidth="0.5" fill="none"/>
    </svg>
  );
}
