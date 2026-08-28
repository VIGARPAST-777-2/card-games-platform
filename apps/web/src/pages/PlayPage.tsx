import { useSearchParams, useParams } from 'react-router-dom';

export function PlayPage() {
  const [params] = useSearchParams();
  const { matchId } = useParams();
  const mode = params.get('mode') ?? 'quick';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="text-2xl font-bold mb-2">Mesa de juego</h1>
        <p className="text-slate-400 mb-6">
          {matchId ? (
            <>
              Partida <code className="text-deckora-400">{matchId}</code>
            </>
          ) : (
            <>
              Modo seleccionado: <span className="text-deckora-300 font-medium">{mode}</span>
            </>
          )}
        </p>

        <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-800 text-left text-sm space-y-2">
          <p className="text-slate-300 font-medium">🚧 En construcción</p>
          <ul className="list-disc list-inside text-slate-400 space-y-1">
            <li>Conexión Socket.io al servidor</li>
            <li>Matchmaking / creación de sala</li>
            <li>Render de cartas y turnos</li>
            <li>Sistema de reconexión con bot</li>
          </ul>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          El motor de partidas y la autoridad del servidor se implementarán en <code>apps/server</code>.
        </p>
      </div>
    </div>
  );
}
