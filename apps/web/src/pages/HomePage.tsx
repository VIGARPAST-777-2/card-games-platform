import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const MODES = [
  { id: 'bot', title: 'Contra bots', desc: 'Practica con dificultad adaptativa', icon: '🤖' },
  { id: 'quick', title: 'Partida rápida', desc: 'Matchmaking casual', icon: '⚡' },
  { id: 'friendly', title: 'Amistosa', desc: 'Sin afectar al rango', icon: '🤝' },
  { id: 'private', title: 'Privada', desc: 'Sala con código', icon: '🔒' },
  { id: 'ranked', title: 'Ranked', desc: 'MMR y temporadas', icon: '🏆' },
];

export function HomePage() {
  const { profile, user } = useAuthStore();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="text-center mb-12">
        <img src="/logo-icon.svg" alt="Deckora" className="w-20 h-20 mx-auto mb-4" />
        <h1 className="font-display text-4xl sm:text-5xl text-navy-900 mb-3">Deckora</h1>
        <p className="text-navy-600 text-lg max-w-xl mx-auto">
          Juegos de cartas clásicos. Compite, colecciona y juega con amigos.
        </p>
        {!user && (
          <Link
            to="/auth"
            className="inline-block mt-6 rounded-lg bg-navy-900 text-white px-6 py-2.5 font-medium hover:bg-navy-800"
          >
            Crear cuenta gratis
          </Link>
        )}
        {profile && (
          <p className="mt-4 text-sm text-navy-500">
            Hola, <span className="font-semibold text-navy-800">{profile.username}</span>
            {' · '}{profile.coins.toLocaleString()} monedas · racha {profile.current_streak}
          </p>
        )}
      </section>

      <h2 className="font-display text-xl text-navy-900 mb-4">Modos de juego</h2>
      <p className="text-sm text-navy-500 mb-4">
        El primer juego se anunciará pronto. Los modos ya están preparados.
      </p>
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {MODES.map((m) => (
          <Link
            key={m.id}
            to={`/play?mode=${m.id}`}
            className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:shadow-card hover:border-navy-200 transition"
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <h3 className="font-semibold text-navy-900">{m.title}</h3>
            <p className="text-sm text-navy-500 mt-1">{m.desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/store', title: 'Tienda', desc: 'Cosméticos y monedas' },
          { to: '/pass', title: 'Pase de temporada', desc: 'Misiones y recompensas' },
          { to: '/clubs', title: 'Clubes', desc: 'Comunidad y competición' },
        ].map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="rounded-xl bg-navy-900 text-white p-5 hover:bg-navy-800 transition"
          >
            <h3 className="font-display text-lg">{x.title}</h3>
            <p className="text-sm text-navy-200 mt-1">{x.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
