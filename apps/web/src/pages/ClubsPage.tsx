import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Club {
  id: string;
  name: string;
  tag: string;
  description: string | null;
}

export function ClubsPage() {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = await getSupabase();
      if (!sb) return;
      const { data } = await sb.from('clubs').select('id, name, tag, description').limit(50);
      if (data) setClubs(data as Club[]);
    })();
  }, []);

  async function createClub() {
    if (!user) {
      setMsg('Inicia sesión');
      return;
    }
    const token = (await (await getSupabase())?.auth.getSession())?.data.session?.access_token;
    const res = await fetch('/api/clubs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, tag }),
    });
    const body = await res.json();
    if (!res.ok) setMsg(body.error);
    else {
      setMsg('Club creado');
      setClubs((c) => [...c, body.club]);
      setName('');
      setTag('');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-navy-900 mb-2">Clubes</h1>
      <p className="text-navy-500 mb-8">Únete o crea un club para jugar en comunidad.</p>

      <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft mb-8">
        <h2 className="font-semibold text-navy-900 mb-3">Crear club</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 rounded-lg border border-navy-200 px-3 py-2"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="TAG"
            maxLength={5}
            className="w-28 rounded-lg border border-navy-200 px-3 py-2"
          />
          <button
            type="button"
            onClick={createClub}
            className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-medium"
          >
            Crear
          </button>
        </div>
        {msg && <p className="text-sm text-navy-600 mt-2">{msg}</p>}
      </div>

      <ul className="space-y-3">
        {clubs.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-navy-100 bg-white px-5 py-4 flex items-center gap-4 shadow-soft"
          >
            <span className="rounded-md bg-navy-900 text-white text-xs font-bold px-2 py-1">
              {c.tag}
            </span>
            <div>
              <div className="font-semibold text-navy-900">{c.name}</div>
              {c.description && <div className="text-sm text-navy-500">{c.description}</div>}
            </div>
          </li>
        ))}
        {clubs.length === 0 && (
          <li className="text-navy-500 text-sm">No hay clubes todavía.</li>
        )}
      </ul>
    </div>
  );
}
