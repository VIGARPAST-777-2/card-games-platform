import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { t } from '../i18n';
import { IconCards } from '../components/Icons';

const MODES = [
  { id: 'ranked', key: 'ranked' as const, desc: { es: 'MMR y ranking oficial', en: 'MMR and official ranking', fr: 'MMR et classement' } },
  { id: 'quick', key: 'quick' as const, desc: { es: 'Matchmaking rapido', en: 'Fast matchmaking', fr: 'Matchmaking rapide' } },
  { id: 'friendly', key: 'friendly' as const, desc: { es: 'Con bots o amigos, sin ranking', en: 'Bots or friends, unranked', fr: 'Bots ou amis, sans classement' } },
  { id: 'bot', key: 'bots' as const, desc: { es: 'Practica contra la IA', en: 'Practice vs AI', fr: 'Entrainement vs IA' } },
  { id: 'private', key: 'private' as const, desc: { es: 'Sala con codigo', en: 'Room with code', fr: 'Salle avec code' } },
];

export function HomePage() {
  const { profile, lang } = useAuthStore();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 text-white mb-4">
          <IconCards className="w-7 h-7" />
        </div>
        <h1 className="font-brand text-4xl text-navy-900 mb-3">{t(lang, 'pokerTitle')}</h1>
        <p className="text-navy-600 max-w-xl mx-auto">{t(lang, 'pokerSub')}</p>
        {profile && (
          <p className="mt-3 text-sm text-navy-500">
            {profile.username} · {t(lang, 'coins')}: {profile.coins.toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <Link
            key={m.id}
            to={`/play?mode=${m.id}`}
            className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:border-navy-300 hover:shadow-card transition-all"
          >
            <h2 className="font-semibold text-navy-900 text-lg">{t(lang, m.key)}</h2>
            <p className="text-sm text-navy-500 mt-1">{m.desc[lang]}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-navy-100 bg-white p-6 shadow-soft">
        <h2 className="font-semibold text-navy-900 mb-2">Texas Hold'em</h2>
        <p className="text-sm text-navy-600 leading-relaxed">
          {lang === 'en'
            ? 'Standard rules: blinds, preflop, flop, turn, river and showdown. Fold, check, call, raise and all-in. Temporary bots keep the hand if you disconnect.'
            : lang === 'fr'
              ? 'Regles standard: blinds, preflop, flop, turn, river et abattage. Se coucher, checker, suivre, relancer et tapis. Des bots temporaires gardent la main en cas de deconnexion.'
              : 'Reglas estandar: ciegas, preflop, flop, turn, river y showdown. Retirarse, pasar, igualar, subir y all-in. Bots temporales mantienen la mano si te desconectas.'}
        </p>
      </div>
    </div>
  );
}
