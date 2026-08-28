import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, username);
    setLoading(false);
    if (err) setError(err);
    else navigate('/profile');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-navy-100 shadow-card p-8">
        <div className="text-center mb-8">
          <img src="/logo-icon.svg" alt="" className="w-14 h-14 mx-auto mb-3" />
          <h1 className="font-display text-2xl text-navy-900">Deckora</h1>
          <p className="text-sm text-navy-500 mt-1">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Usuario</label>
              <input
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                placeholder="tu_nombre"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-900 text-white font-medium py-2.5 hover:bg-navy-800 disabled:opacity-60"
          >
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-500">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button type="button" className="text-navy-900 font-medium" onClick={() => setMode('register')}>
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button type="button" className="text-navy-900 font-medium" onClick={() => setMode('login')}>
                Entra
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
