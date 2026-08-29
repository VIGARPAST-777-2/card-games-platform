import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { t } from '../i18n';

export function ProfilePage() {
  const { profile, user, ready, refreshProfile, lang } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!ready) {
    return <div className="p-10 text-center text-navy-500">…</div>;
  }

  if (!user || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <img src="/logo-icon.svg" alt="" className="w-16 h-16 mx-auto mb-4" />
        <p className="text-navy-600 mb-4">{t(lang, 'login')}</p>
        <Link to="/auth" className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-medium">
          {t(lang, 'login')}
        </Link>
      </div>
    );
  }

  async function onFile(file: File) {
    if (file.size > 400_000) {
      setMsg('Max 400KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const { ok, data } = await api<{ error?: string }>('/api/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
      });
      setMsg(ok ? 'OK' : data.error ?? 'Error');
      if (ok) refreshProfile();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-full bg-navy-900 text-white flex items-center justify-center text-2xl font-brand overflow-hidden border-2 border-navy-100"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.username[0]?.toUpperCase()
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <div>
            <h1 className="font-brand text-xl text-navy-900">{profile.username}</h1>
            <p className="text-navy-500 text-sm">
              Nivel {profile.level}
              {profile.title ? ` · ${profile.title}` : ''}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-navy-600 underline mt-1"
            >
              {t(lang, 'uploadPhoto')}
            </button>
          </div>
        </div>

        {msg && <p className="text-sm text-navy-600 mb-3">{msg}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
          {[
            { label: t(lang, 'coins'), value: profile.coins },
            { label: t(lang, 'gems'), value: profile.gems },
            { label: 'W', value: profile.wins },
            { label: 'Streak', value: profile.current_streak },
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
