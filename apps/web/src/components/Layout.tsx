import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: ReactNode;
}

const NAV = [
  { to: '/', label: 'Inicio' },
  { to: '/play', label: 'Jugar' },
  { to: '/store', label: 'Tienda' },
  { to: '/pass', label: 'Pase' },
  { to: '/friends', label: 'Amigos' },
  { to: '/clubs', label: 'Clubes' },
  { to: '/chat', label: 'Chat' },
  { to: '/bets', label: 'Apuestas' },
];

export function Layout({ children }: Props) {
  const location = useLocation();
  const { profile, user, signOut } = useAuthStore();

  return (
    <div className="min-h-dvh flex flex-col bg-cream-100 font-sans">
      <header className="border-b border-navy-100 bg-white sticky top-0 z-50 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-icon.svg" alt="" className="w-8 h-8" />
            <img
              src="/deckora-wordmark.svg"
              alt="Deckora"
              className="h-7 hidden sm:block"
            />
          </Link>

          <nav className="flex-1 flex gap-0.5 overflow-x-auto text-sm font-medium">
            {NAV.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
                    active
                      ? 'bg-navy-900 text-white'
                      : 'text-navy-700 hover:bg-navy-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0 text-sm">
            {user && (
              <Link
                to="/notifications"
                className="text-navy-600 hover:text-navy-900 px-2"
                title="Notificaciones"
              >
                🔔
              </Link>
            )}
            {profile && (
              <span className="hidden md:inline rounded-full bg-navy-50 text-navy-800 px-2.5 py-0.5 font-medium">
                {profile.coins.toLocaleString()} 🪙
              </span>
            )}
            {user ? (
              <>
                <Link to="/profile" className="font-medium text-navy-900">
                  {profile?.username ?? 'Perfil'}
                </Link>
                <button type="button" onClick={() => signOut()} className="text-navy-500 text-xs">
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-md bg-navy-900 text-white px-3 py-1.5 font-medium"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-100 py-4 text-center text-xs text-navy-400 bg-white">
        <img src="/deckora-wordmark.svg" alt="Deckora" className="h-5 inline-block opacity-80" />
        <span className="mx-2">·</span>
        Juegos de cartas · 2026
      </footer>
    </div>
  );
}
