import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function FriendsPage() {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [friends, setFriends] = useState<{ id: string; status: string; requester_id: string; addressee_id: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { ok, data } = await api<typeof friends>('/api/friends');
    if (ok) setFriends(data);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function addFriend() {
    if (!user) {
      setMsg('Inicia sesión');
      return;
    }
    const { ok, data } = await api<{ error?: string }>('/api/friends/request', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    setMsg(ok ? 'Solicitud enviada' : data.error ?? 'Error');
    if (ok) {
      setUsername('');
      load();
    }
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-navy-600">
        <p>Inicia sesión para gestionar amigos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-brand text-3xl text-navy-900 mb-6">Amigos</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de usuario"
          className="flex-1 rounded-lg border border-navy-200 px-3 py-2"
        />
        <button
          type="button"
          onClick={addFriend}
          className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-medium"
        >
          Añadir
        </button>
      </div>
      {msg && <p className="text-sm text-navy-600 mb-4">{msg}</p>}
      <ul className="space-y-2">
        {friends.length === 0 && (
          <li className="text-navy-500 text-sm">Aún no tienes amigos.</li>
        )}
        {friends.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-navy-100 bg-white px-4 py-3 flex justify-between"
          >
            <span className="font-medium text-navy-900 text-sm">{f.id.slice(0, 8)}…</span>
            <span className="text-xs text-navy-500">{f.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
