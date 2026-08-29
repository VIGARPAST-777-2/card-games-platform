import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { t } from '../i18n';
import { IconCards, IconCoin, IconGem, IconBell, IconShield, IconUser } from '../components/Icons';
import { formatRank } from '@deckora/shared';

const NEWS = [
  {
    id: '1',
    tag: 'Actualizacion',
    title: 'Texas Hold\'em y Omaha en partida rapida y salas privadas',
    body: 'Elige modalidad, espera a que se llene la mesa o invita amigos y rellena con bots.',
  },
  {
    id: '2',
    tag: 'Anuncio',
    title: 'Rangos oficiales',
    body: 'Desde Novato hasta Gran Maestro. A mas rango, menos XP por victoria.',
  },
  {
    id: '3',
    tag: 'Sorteo',
    title: 'Sorteo de monedas de bienvenida',
    body: 'Los administradores pueden lanzar sorteos desde el panel. Participa cuando haya uno activo.',
  },
];

export function HomePage() {
  const { profile, user, lang } = useAuthStore();
  const rankLabel = formatRank(800, lang);
  const isAdmin = Boolean(profile?.is_admin) || profile?.username?.toLowerCase() === 'vigarpast';

  const shortcuts = [
    { to: '/play', label: t(lang, 'play'), desc: 'Rapida o privada', icon: IconCards },
    { to: '/store', label: t(lang, 'store'), desc: 'Cosmeticos y packs', icon: IconCoin },
    { to: '/pass', label: t(lang, 'pass'), desc: 'Misiones de temporada', icon: IconGem },
    { to: '/friends', label: t(lang, 'friends'), desc: 'Solicitudes y lista', icon: IconUser },
    { to: '/clubs', label: t(lang, 'clubs'), desc: 'Clubes y chat', icon: IconShield },
    { to: '/chat', label: t(lang, 'chat'), desc: 'DM y clubes', icon: IconBell },
    { to: '/notifications', label: t(lang, 'notifications'), desc: 'Avisos', icon: IconBell },
    { to: '/profile', label: t(lang, 'profile'), desc: 'Foto y stats', icon: IconUser },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-navy-900 text-white p-6 sm:p-8 shadow-card anim-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <img src="/deckora-wordmark.svg" alt="Deckora" className="h-8 brightness-0 invert mb-3" />
            <h1 className="font-brand text-3xl sm:text-4xl mb-2">{t(lang, 'pokerTitle')}</h1>
            <p className="text-navy-200 text-sm sm:text-base max-w-lg">{t(lang, 'pokerSub')}</p>
            {profile ? (
              <p className="mt-4 text-sm text-navy-300">
                {profile.username} · {rankLabel} · {profile.coins.toLocaleString()} monedas · {profile.gems} gemas
              </p>
            ) : (
              <Link
                to="/auth"
                className="inline-block mt-4 rounded-lg bg-white text-navy-900 px-4 py-2 text-sm font-medium"
              >
                {t(lang, 'login')}
              </Link>
            )}
          </div>
          <Link
            to="/play"
            className="shrink-0 rounded-xl bg-white text-navy-900 px-8 py-4 text-center font-semibold hover:bg-cream-200 transition-colors"
          >
            {t(lang, 'play')}
            <span className="block text-xs font-normal text-navy-500 mt-1">Hold'em · Omaha</span>
          </Link>
        </div>
      </section>

      {/* Atajos nav */}
      <section>
        <h2 className="font-semibold text-navy-900 mb-3">Accesos rapidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft hover:border-navy-300 transition-colors"
              >
                <Icon className="w-5 h-5 text-navy-800 mb-2" />
                <div className="font-medium text-navy-900 text-sm">{s.label}</div>
                <div className="text-xs text-navy-500 mt-0.5">{s.desc}</div>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-xl border border-navy-900 bg-navy-900 text-white p-4 shadow-soft"
            >
              <IconShield className="w-5 h-5 mb-2" />
              <div className="font-medium text-sm">{t(lang, 'admin')}</div>
              <div className="text-xs text-navy-300 mt-0.5">Panel completo</div>
            </Link>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Noticias */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-navy-900">Anuncios y actualizaciones</h2>
          {NEWS.map((n) => (
            <article
              key={n.id}
              className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-navy-500">{n.tag}</span>
              <h3 className="font-medium text-navy-900 mt-1">{n.title}</h3>
              <p className="text-sm text-navy-600 mt-1">{n.body}</p>
            </article>
          ))}
        </section>

        {/* Lateral */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft">
            <h2 className="font-semibold text-navy-900 mb-2">Sorteos</h2>
            <p className="text-sm text-navy-600">
              Cuando haya un sorteo activo (monedas, gemas o pase), aparecera aqui y en notificaciones. El admin
              ViGarPast puede lanzarlos desde el panel.
            </p>
            {user ? (
              <Link to="/notifications" className="inline-block mt-3 text-sm text-navy-900 underline">
                Ver notificaciones
              </Link>
            ) : (
              <Link to="/auth" className="inline-block mt-3 text-sm text-navy-900 underline">
                Entra para participar
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft">
            <h2 className="font-semibold text-navy-900 mb-2">Como se juega</h2>
            <ul className="text-sm text-navy-600 space-y-2 list-disc list-inside">
              <li>
                <strong className="text-navy-800">Rapida:</strong> elige Hold'em u Omaha y espera a llenar la mesa.
              </li>
              <li>
                <strong className="text-navy-800">Privada:</strong> invitas, eliges tiempo y empiezas cuando quieras (bots
                opcionales).
              </li>
              <li>La mesa se juega a pantalla completa en horizontal.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft">
            <h2 className="font-semibold text-navy-900 mb-2">Sobre Deckora</h2>
            <p className="text-sm text-navy-600">
              PWA de poker online (Texas Hold'em y Omaha). Cuentas, rangos, clubes, chat, tienda y pase de
              temporada. Un solo servicio web con partidas en tiempo real.
            </p>
            <p className="text-xs text-navy-400 mt-3">Deckora · 2026</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
