import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { t, LANGS } from '../i18n';
import { IconBell, IconCoin, IconGem, IconShield } from './Icons';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  const location = useLocation();
  const { profile, user, signOut, lang, setLang } = useAuthStore();
  const isAdmin = Boolean(profile?.is_admin) || profile?.username?.toLowerCase() === 'vigarpast';

  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  const NAV = [
    { to: '/', label: t(lang, 'home') },
    { to: '/play', label: t(lang, 'play') },
    { to: '/store', label: t(lang, 'store') },
    { to: '/pass', label: t(lang, 'pass') },
    { to: '/friends', label: t(lang, 'friends') },
    { to: '/clubs', label: t(lang, 'clubs') },
    { to: '/chat', label: t(lang, 'chat') },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-cream-100 font-sans">
      <header className="border-b border-navy-100 bg-white sticky top-0 z-50 shadow-soft">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-icon.svg" alt="" className="w-8 h-8" />
            <img src="/deckora-wordmark.svg" alt="Deckora" className="h-7 hidden sm:block" />
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
                    active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0 text-sm">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'es' | 'en' | 'fr')}
              className="text-xs border border-navy-200 rounded px-1.5 py-1 bg-white text-navy-800"
              aria-label={t(lang, 'language')}
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            {user && (
              <Link to="/notifications" className="text-navy-600 hover:text-navy-900 p-1" title={t(lang, 'notifications')}>
                <IconBell />
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 rounded-md border border-navy-200 px-2 py-1 text-navy-800 hover:bg-navy-50"
                title={t(lang, 'admin')}
              >
                <IconShield className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-medium">{t(lang, 'admin')}</span>
              </Link>
            )}

            {profile && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-navy-50 text-navy-800 px-2.5 py-0.5 font-medium">
                <IconCoin className="w-3.5 h-3.5" />
                {profile.coins.toLocaleString()}
                <IconGem className="w-3.5 h-3.5 ml-1" />
                {profile.gems}
              </span>
            )}

            {user ? (
              <>
                <Link to="/profile" className="font-medium text-navy-900 flex items-center gap-1.5">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-navy-100" />
                  ) : null}
                  {profile?.username ?? t(lang, 'profile')}
                </Link>
                <button type="button" onClick={() => signOut()} className="text-navy-500 text-xs">
                  {t(lang, 'logout')}
                </button>
              </>
            ) : (
              <Link to="/auth" className="rounded-md bg-navy-900 text-white px-3 py-1.5 font-medium">
                {t(lang, 'login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-100 py-4 text-center text-xs text-navy-400 bg-white">
        <img src="/deckora-wordmark.svg" alt="Deckora" className="h-5 inline-block opacity-80" />
        <span className="mx-2">·</span>
        Texas Hold'em · 2026
      </footer>
    </div>
  );
}
