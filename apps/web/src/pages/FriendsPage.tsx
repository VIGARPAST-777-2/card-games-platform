import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function FriendsPage() {
  const { profile, user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [friends, setFriends] = useState<{ id: string; username: string; status: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!profile) return;
    const sb = await getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from('friendships')
      .select('id, status, requester_id, addressee_id')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
    // simplificado: mostrar ids; enriquecer en server después
    if (data) {
      setFriends(
        data.map((f) => ({
          id: f.id,
          username: f.requester_id === profile.id ? f.addressee_id.slice(0, 8) : f.requester_id.slice(0, 8),
          status: f.status,
        }))
      );
    }
  }

  useEffect(() => {
    load();
  }, [profile?.id]);

  async function addFriend() {
    if (!user) {
      setMsg('Inicia sesión');
      return;
    }
    const token = (await (await getSupabase())?.auth.getSession())?.data.session?.access_token;
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });
    const body = await res.json();
    setMsg(res.ok ? 'Solicitud enviada' : body.error);
    if (res.ok) {
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
      <h1 className="font-display text-3xl text-navy-900 mb-6">Amigos</h1>
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
          <li className="text-navy-500 text-sm">Aún no tienes amigos. ¡Invita a alguien!</li>
        )}
        {friends.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-navy-100 bg-white px-4 py-3 flex justify-between"
          >
            <span className="font-medium text-navy-900">{f.username}</span>
            <span className="text-xs text-navy-500">{f.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
