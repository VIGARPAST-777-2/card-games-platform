import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  price_coins: number;
  price_gems: number;
}

export function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const { profile, user, refreshProfile } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = await getSupabase();
      if (!sb) return;
      const { data } = await sb.from('store_items').select('*').eq('active', true);
      if (data) setItems(data as StoreItem[]);
    })();
  }, []);

  async function buy(item: StoreItem) {
    if (!user || !profile) {
      setMsg('Inicia sesión para comprar');
      return;
    }
    const res = await fetch('/api/store/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await (await getSupabase())?.auth.getSession())?.data.session?.access_token}`,
      },
      body: JSON.stringify({ itemId: item.id }),
    });
    const body = await res.json();
    if (!res.ok) setMsg(body.error ?? 'Error');
    else {
      setMsg(`Comprado: ${item.name}`);
      await refreshProfile();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-navy-900 mb-2">Tienda</h1>
      <p className="text-navy-500 mb-6">
        Cosméticos, monedas y pase. Todo cosmético — sin pay-to-win.
        {profile && (
          <span className="ml-2 font-semibold text-navy-800">
            Tu saldo: {profile.coins.toLocaleString()} 🪙 · {profile.gems} 💎
          </span>
        )}
      </p>
      {msg && <p className="mb-4 text-sm rounded-lg bg-navy-50 text-navy-800 px-3 py-2">{msg}</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft flex flex-col"
          >
            <div className="text-xs uppercase tracking-wide text-navy-400 mb-1">{item.kind}</div>
            <h2 className="font-semibold text-navy-900">{item.name}</h2>
            <p className="text-sm text-navy-500 mt-1 flex-1">{item.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-navy-800">
                {item.price_coins > 0 && `${item.price_coins} 🪙 `}
                {item.price_gems > 0 && `${item.price_gems} 💎`}
                {item.price_coins === 0 && item.price_gems === 0 && 'Gratis'}
              </span>
              <button
                type="button"
                onClick={() => buy(item)}
                className="rounded-lg bg-navy-900 text-white text-sm px-3 py-1.5 hover:bg-navy-800"
              >
                Comprar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
