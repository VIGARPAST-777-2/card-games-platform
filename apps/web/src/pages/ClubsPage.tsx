import { useState } from 'react';
import { api } from '../lib/api';
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

  async function createClub() {
    if (!user) {
      setMsg('Inicia sesión');
      return;
    }
    const { ok, data } = await api<{ error?: string; club?: Club }>('/api/clubs', {
      method: 'POST',
      body: JSON.stringify({ name, tag }),
    });
    if (!ok) setMsg(data.error ?? 'Error');
    else if (data.club) {
      setMsg('Club creado');
      setClubs((c) => [...c, data.club!]);
      setName('');
      setTag('');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-brand text-3xl text-navy-900 mb-2">Clubes</h1>
      <p className="text-navy-500 mb-8">Crea un club para jugar en comunidad.</p>

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
            <div className="font-semibold text-navy-900">{c.name}</div>
          </li>
        ))}
        {clubs.length === 0 && (
          <li className="text-navy-500 text-sm">Crea el primer club de la sesión.</li>
        )}
      </ul>
    </div>
  );
}
