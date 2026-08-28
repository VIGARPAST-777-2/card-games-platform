export function ProfilePage() {
  const mock = {
    username: 'VIGARPAST_777',
    level: 34,
    wins: 182,
    games: 310,
    maxStreak: 12,
    ranks: [
      { game: 'Poker', rank: 'Oro II' },
      { game: 'Rummy', rank: 'Diamante I' },
      { game: 'Tute', rank: 'Plata III' },
    ],
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="rounded-xl border border-wood-700 bg-felt-900/60 p-6 shadow-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-felt-700 border-2 border-gold-500/60 flex items-center justify-center text-2xl font-display text-cream-100">
            {mock.username[0]}
          </div>
          <div>
            <h1 className="text-xl font-display text-cream-100">{mock.username}</h1>
            <p className="text-cream-300/70 text-sm">Nivel {mock.level}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          {[
            { label: 'Victorias', value: mock.wins },
            { label: 'Partidas', value: mock.games },
            { label: 'Racha máx.', value: mock.maxStreak },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-wood-950/50 p-3 border border-wood-700"
            >
              <div className="text-lg font-semibold text-gold-400">{s.value}</div>
              <div className="text-xs text-cream-400/60">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-sm text-cream-200 mb-3">Rankings</h2>
        <ul className="space-y-2">
          {mock.ranks.map((r) => (
            <li
              key={r.game}
              className="flex justify-between items-center rounded-lg bg-wood-950/40 px-3 py-2 border border-wood-700"
            >
              <span className="text-cream-200">{r.game}</span>
              <span className="text-gold-400 font-medium">🏆 {r.rank}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-cream-400/50 text-center">
          Perfil de demostración. Datos reales vía API + Auth próximamente.
        </p>
      </div>
    </div>
  );
}
