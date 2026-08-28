import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = (await (await getSupabase())?.auth.getSession())?.data.session?.access_token;
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(await res.json());
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="p-10 text-center text-navy-600">
        <Link to="/auth" className="underline">Inicia sesión</Link> para ver notificaciones.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-brand text-2xl text-navy-900 mb-6">Notificaciones</h1>
      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="text-navy-500 text-sm">No hay notificaciones.</li>
        )}
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg border border-navy-100 bg-white p-4 ${
              n.read ? 'opacity-70' : ''
            }`}
          >
            <div className="font-medium text-navy-900">{n.title}</div>
            {n.body && <p className="text-sm text-navy-600 mt-1">{n.body}</p>}
            <div className="text-xs text-navy-400 mt-2">
              {new Date(n.created_at).toLocaleString()}
              {n.href && (
                <>
                  {' · '}
                  <Link to={n.href} className="text-navy-700 underline">
                    Ver
                  </Link>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
