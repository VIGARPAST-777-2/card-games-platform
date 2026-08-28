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
];

export function Layout({ children }: Props) {
  const location = useLocation();
  const { profile, user, signOut } = useAuthStore();

  return (
    <div className="min-h-dvh flex flex-col bg-cream-100">
      <header className="border-b border-navy-100 bg-white/90 backdrop-blur sticky top-0 z-50 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-icon.svg" alt="" className="w-9 h-9" />
            <span className="font-display text-xl text-navy-900 tracking-tight hidden sm:inline">
              Deckora
            </span>
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
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
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

          <div className="flex items-center gap-3 shrink-0">
            {profile && (
              <div className="hidden md:flex items-center gap-2 text-sm text-navy-800">
                <span className="rounded-full bg-gold-400/20 text-gold-600 px-2.5 py-0.5 font-semibold">
                  {profile.coins.toLocaleString()} 🪙
                </span>
                <span className="text-navy-500">🔥 {profile.current_streak}</span>
              </div>
            )}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-navy-800 hover:text-navy-600"
                >
                  {profile?.username ?? 'Perfil'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-navy-500 hover:text-navy-800"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-lg bg-navy-900 text-white text-sm font-medium px-3 py-1.5 hover:bg-navy-800"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-100 py-5 text-center text-xs text-navy-400 bg-white">
        <span className="font-display text-navy-900">Deckora</span>
        {' · '}Juegos de cartas · 2026
      </footer>
    </div>
  );
}
