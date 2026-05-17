function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const PALETTES = [
  { bg: '#1a5c48', accent: '#c8a96e', text: '#f0e8d8' },
  { bg: '#5c1a1a', accent: '#c8a96e', text: '#f0e8d8' },
  { bg: '#1a1a5c', accent: '#c8a96e', text: '#f0e8d8' },
  { bg: '#2d1a5c', accent: '#c8a96e', text: '#f0e8d8' },
  { bg: '#1a3a5c', accent: '#c8a96e', text: '#f0e8d8' },
  { bg: '#5c3a1a', accent: '#c8a96e', text: '#f0e8d8' },
];

export function generateCoverSVG(title: string, author: string): string {
  const hash = hashStr(title);
  const palette = PALETTES[hash % PALETTES.length]!;

  const titleLines = splitText(title, 16);
  const titleY = 140 - (titleLines.length - 1) * 14;

  const titleSVG = titleLines.map((line, i) =>
    `<text x="100" y="${titleY + i * 28}" font-family="Georgia, serif" font-size="18" font-weight="600" fill="${palette.text}" text-anchor="middle" letter-spacing="1">${escapeXML(line)}</text>`
  ).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="${darken(palette.bg, 30)}"/>
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="url(#bg)"/>
  <!-- Border ornament -->
  <rect x="8" y="8" width="184" height="264" fill="none" stroke="${palette.accent}" stroke-width="1" stroke-opacity="0.5"/>
  <rect x="12" y="12" width="176" height="256" fill="none" stroke="${palette.accent}" stroke-width="0.5" stroke-opacity="0.3"/>
  <!-- Top ornament -->
  <path d="M80 40 Q100 30 120 40 Q100 50 80 40Z" fill="${palette.accent}" opacity="0.7"/>
  <line x1="40" y1="40" x2="78" y2="40" stroke="${palette.accent}" stroke-width="0.5" opacity="0.5"/>
  <line x1="122" y1="40" x2="160" y2="40" stroke="${palette.accent}" stroke-width="0.5" opacity="0.5"/>
  <!-- Corner dots -->
  <circle cx="20" cy="20" r="2" fill="${palette.accent}" opacity="0.6"/>
  <circle cx="180" cy="20" r="2" fill="${palette.accent}" opacity="0.6"/>
  <circle cx="20" cy="260" r="2" fill="${palette.accent}" opacity="0.6"/>
  <circle cx="180" cy="260" r="2" fill="${palette.accent}" opacity="0.6"/>
  <!-- Title -->
  ${titleSVG}
  <!-- Divider -->
  <line x1="60" y1="${titleY + titleLines.length * 28 + 4}" x2="140" y2="${titleY + titleLines.length * 28 + 4}" stroke="${palette.accent}" stroke-width="0.5" opacity="0.7"/>
  <!-- Author -->
  <text x="100" y="${titleY + titleLines.length * 28 + 24}" font-family="Georgia, serif" font-size="11" font-weight="300" fill="${palette.accent}" text-anchor="middle" letter-spacing="2" font-style="italic">${escapeXML(author)}</text>
  <!-- Bottom ornament -->
  <path d="M90 248 L100 240 L110 248 L100 256Z" fill="${palette.accent}" opacity="0.5"/>
</svg>`;
}

function splitText(text: string, maxLen: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLen) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function svgToDataURL(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
