import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Mission {
  id: string;
  title: string;
  description: string | null;
  target: number;
  reward_coins: number;
  reward_xp: number;
}

export function PassPage() {
  const { profile } = useAuthStore();
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    (async () => {
      const sb = await getSupabase();
      if (!sb) return;
      const { data } = await sb.from('missions').select('*');
      if (data) setMissions(data as Mission[]);
    })();
  }, []);

  const xp = profile?.season_pass_xp ?? 0;
  const tier = Math.floor(xp / 100) + 1;
  const progress = xp % 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-navy-900 mb-2">Pase de temporada</h1>
      <p className="text-navy-500 mb-8">
        Progreso independiente del ranked. Juega para subir de nivel del pase.
      </p>

      <div className="rounded-xl bg-navy-900 text-white p-6 mb-8 shadow-card">
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-navy-300 text-sm">Nivel del pase</div>
            <div className="font-display text-3xl">{tier}</div>
          </div>
          <div className="text-sm text-navy-200">
            {profile?.season_pass_premium ? 'Premium activo' : 'Gratis'}
          </div>
        </div>
        <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
          <div className="h-full bg-gold-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-navy-300 mt-2">{progress} / 100 XP al siguiente nivel</p>
      </div>

      <h2 className="font-semibold text-navy-900 mb-3">Misiones diarias</h2>
      <ul className="space-y-3">
        {missions.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-navy-100 bg-white p-4 flex justify-between gap-4 shadow-soft"
          >
            <div>
              <div className="font-medium text-navy-900">{m.title}</div>
              <div className="text-sm text-navy-500">{m.description}</div>
            </div>
            <div className="text-sm text-navy-700 whitespace-nowrap">
              +{m.reward_coins} 🪙 · +{m.reward_xp} XP
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
