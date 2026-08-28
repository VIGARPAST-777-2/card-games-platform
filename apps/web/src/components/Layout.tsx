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
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl tracking-tight text-deckora-400">
            Deckora
          </Link>
          <nav className="flex gap-1">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-deckora-600/20 text-deckora-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        Deckora · PWA de juegos de cartas · 2026
      </footer>
    </div>
  );
}
