import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { t } from '../i18n';
import { IconCards } from '../components/Icons';
import { formatRank } from '@deckora/shared';

export function HomePage() {
  const { profile, lang } = useAuthStore();
  const rankLabel = formatRank(800, lang);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 text-white mb-4">
          <IconCards className="w-7 h-7" />
        </div>
        <h1 className="font-brand text-4xl text-navy-900 mb-3">{t(lang, 'pokerTitle')}</h1>
        <p className="text-navy-600 max-w-xl mx-auto">{t(lang, 'pokerSub')}</p>
        {profile && (
          <p className="mt-3 text-sm text-navy-500">
            {profile.username} · {rankLabel} · {t(lang, 'coins')}: {profile.coins.toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/play"
          className="rounded-xl border border-navy-100 bg-white p-6 shadow-soft hover:border-navy-300 transition-colors"
        >
          <h2 className="font-semibold text-navy-900 text-lg">{t(lang, 'play')}</h2>
          <p className="text-sm text-navy-500 mt-2">
            {lang === 'en'
              ? 'Online matchmaking or private room. Hold\'em and Omaha.'
              : lang === 'fr'
                ? 'Matchmaking en ligne ou salle privee. Hold\'em et Omaha.'
                : 'Partida en linea o sala privada. Hold\'em y Omaha.'}
          </p>
        </Link>
        <Link
          to="/profile"
          className="rounded-xl border border-navy-100 bg-white p-6 shadow-soft hover:border-navy-300 transition-colors"
        >
          <h2 className="font-semibold text-navy-900 text-lg">{t(lang, 'profile')}</h2>
          <p className="text-sm text-navy-500 mt-2">
            {lang === 'en'
              ? 'Rank, stats and avatar.'
              : lang === 'fr'
                ? 'Rang, stats et avatar.'
                : 'Rango, estadisticas y foto.'}
          </p>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-navy-100 bg-white p-5 text-sm text-navy-600">
        <p className="font-medium text-navy-900 mb-2">Rangos</p>
        <p>
          Novato → Bronce → Plata → Oro → Platino → Diamante → Maestro → Gran Maestro. Cuanto mas alto el rango, mas
          dificil subir (menos XP neto por victoria).
        </p>
      </div>
    </div>
  );
}
