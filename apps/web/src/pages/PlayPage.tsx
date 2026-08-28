import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function PlayPage() {
  const [params] = useSearchParams();
  const { matchId } = useParams();
  const mode = params.get('mode') ?? 'quick';
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-card">
        <img src="/logo-icon.svg" alt="" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-navy-900 mb-2">Mesa de juego</h1>
        <p className="text-navy-500 mb-6">
          Modo: <span className="font-semibold text-navy-800">{mode}</span>
          {matchId && (
            <>
              {' · '}Partida <code className="text-navy-700">{matchId}</code>
            </>
          )}
        </p>
        <div className="rounded-xl bg-cream-200/60 border border-navy-50 p-5 text-left text-sm text-navy-700">
          <p className="font-medium text-navy-900 mb-2">Primer juego próximamente</p>
          <p>
            Los modos (bots, rápida, amistosa, privada, ranked), monedas y reconexión ya están en la
            plataforma. Cuando indiques el primer juego, lo montamos sobre este motor.
          </p>
        </div>
        {!user && (
          <Link to="/auth" className="inline-block mt-6 text-sm font-medium text-navy-900 underline">
            Inicia sesión para guardar progreso
          </Link>
        )}
      </div>
    </div>
  );
}
