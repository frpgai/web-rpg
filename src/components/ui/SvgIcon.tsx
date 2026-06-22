import React from 'react';

interface SvgIconProps {
  name?: string;
  size?: number | string;
  color?: string;
  className?: string;
}

export function SvgIcon({ name, size = 24, color = 'currentColor', className = '' }: SvgIconProps) {
  const key = (name ?? '').toLowerCase().replace(/_/g, '-');

  // SVG paths dictionary
  const icons: Record<string, React.ReactNode> = {
    'notebook': (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="14" y2="14" />
      </>
    ),
    'shield-star': (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polygon points="12 8 13.5 11 16.5 11 14 13 15.5 16 12 14 8.5 16 10 13 7.5 11 10.5 11" fill="currentColor" />
      </>
    ),
    'dice-multiple': (
      <>
        <rect x="2" y="2" width="12" height="12" rx="2" ry="2" />
        <path d="M22 10v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-4" />
        <circle cx="8" cy="8" r="1" fill="currentColor" />
        <circle cx="14" cy="14" r="1" fill="currentColor" />
        <circle cx="18" cy="18" r="1" fill="currentColor" />
      </>
    ),
    'eye-outline': (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    'eye': (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </>
    ),
    'check': (
      <polyline points="20 6 9 17 4 12" />
    ),
    'account': (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    'pine-tree': (
      <>
        <path d="M12 2L3 13h6l-7 8h20l-7-8h6L12 2z" />
        <line x1="12" y1="21" x2="12" y2="23" />
      </>
    ),
    'terrain': (
      <>
        <path d="M8 22L1 12l7-5 8 15" />
        <path d="M23 22L16 8l-4 4" />
      </>
    ),
    'skull-outline': (
      <>
        <path d="M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" />
        <path d="M15 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" />
        <path d="M12 2a8 8 0 0 0-8 8c0 2.2.9 4.2 2.5 5.5v3.5c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2v-3.5A7.98 7.98 0 0 0 20 10c0-4.4-3.6-8-8-8zm-2 15h4v2h-4v-2z" />
      </>
    ),
    'sword-cross': (
      <>
        <line x1="2" y1="22" x2="22" y2="2" />
        <line x1="22" y1="22" x2="2" y2="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M6 18l-3 3M18 18l3 3" />
      </>
    ),
    'book-open-page-variant': (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
    'eye-off': (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ),
    'shield-cross': (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="6" x2="12" y2="16" />
        <line x1="8" y1="10" x2="16" y2="10" />
      </>
    ),
    'medal': (
      <>
        <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </>
    ),
    'account-off': (
      <>
        <path d="M16 16v1a4 4 0 0 1-4 4H4v-2a4 4 0 0 1 4-4" />
        <circle cx="12" cy="7" r="4" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ),
    'crown': (
      <>
        <path d="M2 4l3 12h14l3-12-5 6-5-6-5 6-5-6z" />
        <rect x="2" y="18" width="20" height="2" rx="1" />
      </>
    ),
    'weight-lifter': (
      <>
        <line x1="6" y1="12" x2="18" y2="12" strokeWidth="3" />
        <rect x="2" y="6" width="4" height="12" rx="1" fill="currentColor" />
        <rect x="18" y="6" width="4" height="12" rx="1" fill="currentColor" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </>
    ),
    'run': (
      <>
        <circle cx="15" cy="5" r="2" fill="currentColor" />
        <path d="M13 9l-4 3 2 4M9 12l-3 4M17 9l-3-1-2 4 4 4" />
      </>
    ),
    'heart-pulse': (
      <>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M6 12h3l2-4 2 8 2-4h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    'head-cog': (
      <>
        <path d="M16 11a5 5 0 0 0-8 0v2a5 5 0 0 0 8 0v-2z" />
        <path d="M12 2a10 10 0 0 0-10 10c0 4.1 2.5 7.6 6 9.1V22h8v-.9c3.5-1.5 6-5 6-9.1A10 10 0 0 0 12 2z" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    'heart': (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />
    ),
    'star': (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    )
  };

  // Find exact key or alias mappings
  let matchedNode = icons[key];

  if (!matchedNode) {
    // Custom aliases
    if (key.includes('human') || key.includes('person')) matchedNode = icons['account'];
    else if (key.includes('elf') || key.includes('forest')) matchedNode = icons['pine-tree'];
    else if (key.includes('dwarf') || key.includes('mountain')) matchedNode = icons['terrain'];
    else if (key.includes('orc') || key.includes('skull')) matchedNode = icons['skull-outline'];
    else if (key.includes('warrior') || key.includes('swords')) matchedNode = icons['sword-cross'];
    else if (key.includes('mage') || key.includes('book') || key.includes('stories')) matchedNode = icons['book-open-page-variant'];
    else if (key.includes('rogue') || key.includes('visibility') || key.includes('eye-off')) matchedNode = icons['eye-off'];
    else if (key.includes('paladin') || key.includes('shield')) matchedNode = icons['shield-cross'];
    else if (key.includes('soldier') || key.includes('medal') || key.includes('military')) matchedNode = icons['medal'];
    else if (key.includes('criminal') || key.includes('person-off') || key.includes('account-off')) matchedNode = icons['account-off'];
    else if (key.includes('noble') || key.includes('crown')) matchedNode = icons['crown'];
    else if (key.includes('str') || key.includes('weight')) matchedNode = icons['weight-lifter'];
    else if (key.includes('dex') || key.includes('run')) matchedNode = icons['run'];
    else if (key.includes('con') || key.includes('heart-pulse')) matchedNode = icons['heart-pulse'];
    else if (key.includes('int') || key.includes('head') || key.includes('cog')) matchedNode = icons['head-cog'];
    else if (key.includes('wis') || key.includes('eye')) matchedNode = icons['eye-outline'];
    else if (key.includes('cha') || key.includes('heart')) matchedNode = icons['heart'];
    else matchedNode = icons['star']; // default fallback
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {matchedNode}
    </svg>
  );
}
