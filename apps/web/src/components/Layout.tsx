import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const location = useLocation();

  const nav = [
    { to: '/', label: 'Inicio', icon: '🏠' },
    { to: '/play', label: 'Jugar', icon: '🃏' },
    { to: '/profile', label: 'Perfil', icon: '👤' },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-wood-700/80 bg-wood-950/90 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl tracking-wide text-gold-400 hover:text-gold-300 transition"
          >
            Deckora
          </Link>
          <nav className="flex gap-1">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    active
                      ? 'bg-felt-700/60 text-cream-100 border border-felt-500/40'
                      : 'text-cream-300/70 hover:text-cream-100 hover:bg-wood-800/60'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-wood-800 py-4 text-center text-xs text-cream-400/50">
        Deckora · Juegos de cartas · 2026
      </footer>
    </div>
  );
}
