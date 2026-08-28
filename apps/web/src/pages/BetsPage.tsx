import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Bet {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  creator_id: string;
  opponent_id: string | null;
}

export function BetsPage() {
  const { user, profile, refreshProfile } = useAuthStore();
  const [bets, setBets] = useState<Bet[]>([]);
  const [amount, setAmount] = useState(100);
  const [opponent, setOpponent] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { ok, data } = await api<Bet[]>('/api/bets');
    if (ok) setBets(data);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function createBet() {
    const { ok, data } = await api<{ error?: string }>('/api/bets', {
      method: 'POST',
      body: JSON.stringify({ amount, opponentUsername: opponent || null, note }),
    });
    setMsg(ok ? 'Apuesta creada' : data.error ?? 'Error');
    if (ok) {
      load();
      refreshProfile();
    }
  }

  async function accept(id: string) {
    const { ok, data } = await api<{ error?: string }>(`/api/bets/${id}/accept`, {
      method: 'POST',
    });
    setMsg(ok ? 'Apuesta aceptada' : data.error ?? 'Error');
    if (ok) {
      load();
      refreshProfile();
    }
  }

  if (!user) {
    return <div className="p-10 text-center text-navy-600">Inicia sesión para apostar monedas.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-brand text-2xl text-navy-900 mb-2">Apuestas</h1>
      <p className="text-navy-500 text-sm mb-6">
        Solo monedas de juego. Saldo: <strong>{profile?.coins.toLocaleString()} 🪙</strong>
      </p>

      <div className="rounded-xl border border-navy-100 bg-white p-5 mb-8 shadow-soft space-y-3">
        <h2 className="font-medium text-navy-900">Nueva apuesta</h2>
        <input
          type="number"
          min={10}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border border-navy-200 rounded-lg px-3 py-2"
        />
        <input
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          className="w-full border border-navy-200 rounded-lg px-3 py-2"
          placeholder="Rival (usuario, opcional)"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-navy-200 rounded-lg px-3 py-2"
          placeholder="Nota"
        />
        <button
          type="button"
          onClick={createBet}
          className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-medium"
        >
          Crear apuesta
        </button>
        {msg && <p className="text-sm text-navy-600">{msg}</p>}
      </div>

      <ul className="space-y-3">
        {bets.map((b) => (
          <li
            key={b.id}
            className="rounded-xl border border-navy-100 bg-white p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-navy-900">{b.amount} 🪙 · {b.status}</div>
              {b.note && <div className="text-sm text-navy-500">{b.note}</div>}
            </div>
            {b.status === 'open' && b.creator_id !== profile?.id && (
              <button
                type="button"
                onClick={() => accept(b.id)}
                className="text-sm bg-navy-900 text-white px-3 py-1.5 rounded-lg"
              >
                Aceptar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
