import { Link } from 'react-router-dom';

const MODES = [
  {
    id: 'bot',
    title: 'Contra bots',
    desc: 'Practica con dificultad adaptativa',
    icon: '🤖',
    color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-700/40',
  },
  {
    id: 'quick',
    title: 'Partida rápida',
    desc: 'Matchmaking casual, empieza ya',
    icon: '⚡',
    color: 'from-amber-600/20 to-amber-900/10 border-amber-700/40',
  },
  {
    id: 'friendly',
    title: 'Amistosa',
    desc: 'Con amigos, sin afectar rango',
    icon: '🤝',
    color: 'from-sky-600/20 to-sky-900/10 border-sky-700/40',
  },
  {
    id: 'private',
    title: 'Privada',
    desc: 'Sala con código o enlace',
    icon: '🔒',
    color: 'from-violet-600/20 to-violet-900/10 border-violet-700/40',
  },
  {
    id: 'ranked',
    title: 'Ranked',
    desc: 'Competitivo · MMR · Temporadas',
    icon: '🏆',
    color: 'from-rose-600/20 to-rose-900/10 border-rose-700/40',
  },
];

export function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <section className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          <span className="text-deckora-400">Deckora</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
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
            className={`group rounded-2xl border bg-gradient-to-br p-5 transition hover:scale-[1.02] hover:shadow-lg ${
              mode.color
            }`}
          >
            <div className="text-3xl mb-2">{mode.icon}</div>
            <h2 className="font-semibold text-lg mb-1 group-hover:text-white">{mode.title}</h2>
            <p className="text-sm text-slate-400">{mode.desc}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h3 className="font-semibold mb-2">🚀 Estado del proyecto</h3>
        <p className="text-sm text-slate-400">
          Concepto y estructura base listos. Motor de partidas, reconexión y primer juego en desarrollo.
        </p>
      </section>
    </div>
  );
}
