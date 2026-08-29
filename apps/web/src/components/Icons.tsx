/** Iconos SVG limpios — sin emojis */

type IconProps = { className?: string; title?: string };

export function IconBell({ className = 'w-5 h-5', title }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden={!title}>
      {title && <title>{title}</title>}
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCoin({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" className="opacity-20" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontFamily="Georgia, serif" fill="currentColor">
        C
      </text>
    </svg>
  );
}

export function IconGem({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 9h12l-2.5 10h-7L6 9Z" />
      <path d="M6 9l3-4h6l3 4" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function IconUser({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

export function IconShield({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
    </svg>
  );
}

export function IconCards({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5" y="4" width="10" height="14" rx="1.5" transform="rotate(-8 10 11)" />
      <rect x="9" y="5" width="10" height="14" rx="1.5" />
    </svg>
  );
}

const SUIT_PATH: Record<string, string> = {
  spades: 'M12 3c-2 3-6 6-6 9a4 4 0 0 0 7 2.5V20h2v-5.5A4 4 0 0 0 18 12c0-3-4-6-6-9Z',
  hearts: 'M12 20S4 14 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 11-8 11Z',
  diamonds: 'M12 2l6 10-6 10L6 12 12 2Z',
  clubs:
    'M12 12a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm-5 2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm10 0a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM11 14h2v6h-2z',
};

export function PlayingCard({
  rank,
  suit,
  hidden,
  className = '',
}: {
  rank?: string;
  suit?: string;
  hidden?: boolean;
  className?: string;
}) {
  const red = suit === 'hearts' || suit === 'diamonds';
  if (hidden) {
    return (
      <div
        className={`w-14 h-20 rounded-md border border-navy-800 bg-navy-900 shadow-soft flex items-center justify-center ${className}`}
      >
        <div className="w-10 h-14 rounded border border-navy-600 opacity-40" />
      </div>
    );
  }
  return (
    <div
      className={`w-14 h-20 rounded-md border border-navy-200 bg-white shadow-soft flex flex-col items-center justify-between py-1.5 ${className}`}
    >
      <span className={`text-sm font-semibold leading-none ${red ? 'text-red-700' : 'text-navy-900'}`}>
        {rank}
      </span>
      <svg className={`w-5 h-5 ${red ? 'text-red-700' : 'text-navy-900'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d={SUIT_PATH[suit ?? 'spades'] ?? SUIT_PATH.spades} />
      </svg>
      <span className={`text-sm font-semibold leading-none rotate-180 ${red ? 'text-red-700' : 'text-navy-900'}`}>
        {rank}
      </span>
    </div>
  );
}
