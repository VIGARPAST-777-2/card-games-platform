import { useSearchParams, useParams } from 'react-router-dom';

export function PlayPage() {
  const [params] = useSearchParams();
  const { matchId } = useParams();
  const mode = params.get('mode') ?? 'quick';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-xl border border-felt-600/40 bg-felt-900/70 p-8 text-center shadow-card">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="font-display text-2xl text-cream-100 mb-2">Mesa de juego</h1>
        <p className="text-cream-300/75 mb-6">
          {matchId ? (
            <>
              Partida <code className="text-gold-400">{matchId}</code>
            </>
          ) : (
            <>
              Modo: <span className="text-gold-400 font-medium">{mode}</span>
            </>
          )}
        </p>

        <div className="bg-wood-950/50 rounded-lg p-6 border border-wood-700 text-left text-sm space-y-2">
          <p className="text-cream-100 font-medium">En construcción</p>
          <ul className="list-disc list-inside text-cream-300/65 space-y-1">
            <li>Conexión Socket.io al servidor</li>
            <li>Matchmaking / creación de sala</li>
            <li>Render de cartas y turnos</li>
            <li>Sistema de reconexión con bot</li>
          </ul>
        </div>

        <p className="mt-6 text-xs text-cream-400/50">
          Motor de partidas en <code className="text-cream-300/80">apps/server</code>
        </p>
      </div>
    </div>
  );
}
