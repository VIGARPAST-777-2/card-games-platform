import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { t } from '../i18n';
import { IconShield } from '../components/Icons';

export function AdminPage() {
  const { profile, user, lang } = useAuthStore();
  const isAdmin = Boolean(profile?.is_admin) || profile?.username?.toLowerCase() === 'vigarpast';

  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState(500);
  const [gems, setGems] = useState(10);
  const [banReason, setBanReason] = useState('');
  const [giveawayTitle, setGiveawayTitle] = useState('Sorteo semanal');
  const [msg, setMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; slug: string; title_es: string; active: boolean }[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { ok, data } = await api<typeof events>('/api/admin/events');
      if (ok) setEvents(data);
    })();
  }, [isAdmin]);

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-dvh bg-cream-100 flex items-center justify-center p-6">
        <p className="text-navy-600">No autorizado.</p>
      </div>
    );
  }

  async function gift(type: 'coins' | 'gems' | 'pass') {
    const { ok, data } = await api<{ error?: string }>('/api/admin/gift', {
      method: 'POST',
      body: JSON.stringify({
        username,
        coins: type === 'coins' ? amount : 0,
        gems: type === 'gems' ? gems : 0,
        pass: type === 'pass',
      }),
    });
    setMsg(ok ? 'OK' : data.error ?? 'Error');
  }

  async function ban(ban: boolean) {
    const { ok, data } = await api<{ error?: string }>('/api/admin/ban', {
      method: 'POST',
      body: JSON.stringify({ username, ban, reason: banReason }),
    });
    setMsg(ok ? (ban ? 'Baneado' : 'Desbaneado') : data.error ?? 'Error');
  }

  async function createGiveaway() {
    const { ok, data } = await api<{ error?: string }>('/api/admin/giveaway', {
      method: 'POST',
      body: JSON.stringify({ title: giveawayTitle, reward_type: 'coins', reward_amount: amount }),
    });
    setMsg(ok ? 'Sorteo creado' : data.error ?? 'Error');
  }

  async function drawGiveaway(id: string) {
    const { ok, data } = await api<{ error?: string; winner?: string }>(`/api/admin/giveaway/${id}/draw`, {
      method: 'POST',
    });
    setMsg(ok ? `Ganador: ${data.winner ?? '?'}` : data.error ?? 'Error');
  }

  async function toggleEvent(id: string, active: boolean) {
    await api('/api/admin/events/toggle', {
      method: 'POST',
      body: JSON.stringify({ id, active }),
    });
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, active } : e)));
  }

  return (
    <div className="min-h-dvh bg-cream-100">
      <header className="border-b border-navy-100 bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconShield className="w-5 h-5" />
            <span className="font-brand text-lg">Deckora Admin</span>
          </div>
          <Link to="/" className="text-sm text-navy-200 hover:text-white">
            Volver a la app
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <p className="text-sm text-navy-500">
          Sesion: <strong className="text-navy-900">{profile?.username}</strong>
        </p>
        {msg && (
          <p className="text-sm rounded-lg bg-navy-50 border border-navy-100 px-3 py-2 text-navy-800">{msg}</p>
        )}

        <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft space-y-3">
          <h2 className="font-semibold text-navy-900">Usuario objetivo</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full border border-navy-200 rounded-lg px-3 py-2"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-28 border border-navy-200 rounded-lg px-2 py-2"
            />
            <button type="button" onClick={() => gift('coins')} className="rounded-lg bg-navy-900 text-white px-3 py-2 text-sm">
              {t(lang, 'giftCoins')}
            </button>
            <input
              type="number"
              value={gems}
              onChange={(e) => setGems(Number(e.target.value))}
              className="w-20 border border-navy-200 rounded-lg px-2 py-2"
            />
            <button type="button" onClick={() => gift('gems')} className="rounded-lg bg-navy-900 text-white px-3 py-2 text-sm">
              {t(lang, 'giftGems')}
            </button>
            <button type="button" onClick={() => gift('pass')} className="rounded-lg border border-navy-900 px-3 py-2 text-sm">
              Pase premium
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Motivo ban"
              className="flex-1 min-w-[140px] border border-navy-200 rounded-lg px-3 py-2"
            />
            <button type="button" onClick={() => ban(true)} className="rounded-lg bg-red-800 text-white px-3 py-2 text-sm">
              {t(lang, 'ban')}
            </button>
            <button type="button" onClick={() => ban(false)} className="rounded-lg border border-navy-300 px-3 py-2 text-sm">
              Unban
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft space-y-3">
          <h2 className="font-semibold text-navy-900">{t(lang, 'giveaway')}</h2>
          <input
            value={giveawayTitle}
            onChange={(e) => setGiveawayTitle(e.target.value)}
            className="w-full border border-navy-200 rounded-lg px-3 py-2"
          />
          <button type="button" onClick={createGiveaway} className="rounded-lg bg-navy-900 text-white px-3 py-2 text-sm">
            Crear sorteo de monedas
          </button>
        </section>

        <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-navy-900 mb-3">{t(lang, 'events')}</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between items-center text-sm border border-navy-50 rounded-lg px-3 py-2">
                <span>
                  {e.title_es} <span className="text-navy-400">({e.slug})</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleEvent(e.id, !e.active)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    e.active ? 'bg-navy-900 text-white' : 'bg-navy-100 text-navy-600'
                  }`}
                >
                  {e.active ? 'ON' : 'OFF'}
                </button>
              </li>
            ))}
            {events.length === 0 && <li className="text-navy-500 text-sm">Sin eventos</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
