import { Link } from 'react-router-dom';

const MODES = [
  {
    id: 'bot',
    title: 'Contra bots',
    desc: 'Practica con dificultad adaptativa',
    icon: '🤖',
    accent: 'border-felt-500/50 hover:border-felt-400',
  },
  {
    id: 'quick',
    title: 'Partida rápida',
    desc: 'Matchmaking casual, empieza ya',
    icon: '⚡',
    accent: 'border-gold-600/40 hover:border-gold-400',
  },
  {
    id: 'friendly',
    title: 'Amistosa',
    desc: 'Con amigos, sin afectar rango',
    icon: '🤝',
    accent: 'border-cream-400/30 hover:border-cream-300/60',
  },
  {
    id: 'private',
    title: 'Privada',
    desc: 'Sala con código o enlace',
    icon: '🔒',
    accent: 'border-wood-700 hover:border-wood-700',
  },
  {
    id: 'ranked',
    title: 'Ranked',
    desc: 'Competitivo · MMR · Temporadas',
    icon: '🏆',
    accent: 'border-wine-600/50 hover:border-wine-400',
  },
];

export function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <section className="text-center mb-12">
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide mb-3 text-cream-100">
          <span className="text-gold-400">Deckora</span>
        </h1>
        <p className="text-cream-300/80 text-lg max-w-xl mx-auto leading-relaxed">
          Juegos de cartas clásicos. Solo, con amigos o ranked.
          <br />
          Reconexión inteligente y bots que no te dejan tirado.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {MODES.map((mode) => (
          <Link
            key={mode.id}
            to={`/play?mode=${mode.id}`}
            className={`group rounded-xl border bg-felt-900/50 p-5 shadow-card transition hover:bg-felt-800/50 hover:shadow-soft ${
              mode.accent
            }`}
          >
            <div className="text-3xl mb-3">{mode.icon}</div>
            <h2 className="font-display text-lg text-cream-100 mb-1 group-hover:text-gold-300 transition">
              {mode.title}
            </h2>
            <p className="text-sm text-cream-300/65">{mode.desc}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-wood-700/80 bg-wood-950/60 p-6 text-center shadow-soft">
        <h3 className="font-display text-cream-100 mb-2">Estado del proyecto</h3>
        <p className="text-sm text-cream-300/70">
          Base de datos lista · Motor de partidas y primer juego en desarrollo.
        </p>
      </section>
    </div>
  );
}
