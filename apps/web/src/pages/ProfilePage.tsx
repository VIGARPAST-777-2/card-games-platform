export function ProfilePage() {
  // Placeholder de perfil (más adelante vendrá de auth + API)
  const mock = {
    username: 'VIGARPAST_777',
    level: 34,
    xp: 7200,
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-deckora-700 flex items-center justify-center text-2xl font-bold">
            {mock.username[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{mock.username}</h1>
            <p className="text-slate-400 text-sm">Nivel {mock.level} ⭐</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
            <div className="text-lg font-semibold text-deckora-300">{mock.wins}</div>
            <div className="text-xs text-slate-500">Victorias</div>
          </div>
          <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
            <div className="text-lg font-semibold">{mock.games}</div>
            <div className="text-xs text-slate-500">Partidas</div>
          </div>
          <div className="rounded-xl bg-slate-950/50 p-3 border border-slate-800">
            <div className="text-lg font-semibold">{mock.maxStreak}</div>
            <div className="text-xs text-slate-500">Racha máx.</div>
          </div>
        </div>

        <h2 className="font-semibold mb-3 text-sm text-slate-300">Rankings</h2>
        <ul className="space-y-2">
          {mock.ranks.map((r) => (
            <li
              key={r.game}
              className="flex justify-between items-center rounded-lg bg-slate-950/40 px-3 py-2 border border-slate-800"
            >
              <span>{r.game}</span>
              <span className="text-deckora-300 font-medium">🏆 {r.rank}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Perfil de demostración. Auth y datos reales próximamente.
        </p>
      </div>
    </div>
  );
}
