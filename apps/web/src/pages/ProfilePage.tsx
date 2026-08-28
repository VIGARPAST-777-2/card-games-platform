import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProfilePage() {
  const { profile, user, ready } = useAuthStore();

  if (!ready) {
    return <div className="p-10 text-center text-navy-500">Cargando…</div>;
  }

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <img src="/logo-icon.svg" alt="" className="w-16 h-16 mx-auto mb-4" />
        <p className="text-navy-600 mb-4">Inicia sesión para ver tu perfil.</p>
        <Link to="/auth" className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-medium">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-navy-900 text-white flex items-center justify-center text-2xl font-display">
            {profile.username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl text-navy-900">{profile.username}</h1>
            <p className="text-navy-500 text-sm">
              Nivel {profile.level}
              {profile.title ? ` · ${profile.title}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
          {[
            { label: 'Monedas', value: profile.coins },
            { label: 'Gemas', value: profile.gems },
            { label: 'Victorias', value: profile.wins },
            { label: 'Racha', value: profile.current_streak },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-cream-200/80 p-3 border border-navy-50">
              <div className="text-lg font-semibold text-navy-900">{s.value}</div>
              <div className="text-xs text-navy-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="text-sm text-navy-600 space-y-1">
          <p>Partidas: {profile.games_played}</p>
          <p>XP: {profile.xp}</p>
          <p>Mejor racha: {profile.best_streak}</p>
          <p>Pase XP: {profile.season_pass_xp}</p>
        </div>
      </div>
    </div>
  );
}
