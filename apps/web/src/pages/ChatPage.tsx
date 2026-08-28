import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Thread {
  id: string;
  kind: string;
  label: string;
}

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
}

export function ChatPage() {
  const { user, profile } = useAuthStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [dmUser, setDmUser] = useState('');

  async function loadThreads() {
    const { ok, data } = await api<Thread[]>('/api/chat/threads');
    if (ok) setThreads(data);
  }

  async function loadMessages(threadId: string) {
    const { ok, data } = await api<Message[]>(`/api/chat/threads/${threadId}/messages`);
    if (ok) setMessages(data);
  }

  useEffect(() => {
    if (user) loadThreads();
  }, [user]);

  useEffect(() => {
    if (active) loadMessages(active);
  }, [active]);

  async function openDm() {
    const { ok, data } = await api<{ threadId: string }>('/api/chat/dm', {
      method: 'POST',
      body: JSON.stringify({ username: dmUser }),
    });
    if (ok) {
      await loadThreads();
      setActive(data.threadId);
      setDmUser('');
    }
  }

  async function send() {
    if (!active || !text.trim()) return;
    const { ok } = await api(`/api/chat/threads/${active}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body: text }),
    });
    if (ok) {
      setText('');
      loadMessages(active);
    }
  }

  if (!user) {
    return <div className="p-10 text-center text-navy-600">Inicia sesión para chatear.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-[240px_1fr] gap-4 min-h-[60vh]">
      <aside className="rounded-xl border border-navy-100 bg-white p-3">
        <h2 className="font-medium text-navy-900 mb-2 text-sm">Conversaciones</h2>
        <div className="flex gap-1 mb-3">
          <input
            value={dmUser}
            onChange={(e) => setDmUser(e.target.value)}
            placeholder="Usuario DM"
            className="flex-1 text-sm border border-navy-200 rounded px-2 py-1"
          />
          <button type="button" onClick={openDm} className="text-xs bg-navy-900 text-white px-2 rounded">
            +
          </button>
        </div>
        <ul className="space-y-1">
          {threads.map((th) => (
            <li key={th.id}>
              <button
                type="button"
                onClick={() => setActive(th.id)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded ${
                  active === th.id ? 'bg-navy-900 text-white' : 'hover:bg-navy-50 text-navy-800'
                }`}
              >
                {th.kind === 'club' ? '🏛 ' : '💬 '}{th.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-xl border border-navy-100 bg-white flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!active && <p className="text-navy-500 text-sm">Elige o crea un chat.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm max-w-[80%] rounded-lg px-3 py-2 ${
                m.sender_id === profile?.id
                  ? 'ml-auto bg-navy-900 text-white'
                  : 'bg-navy-50 text-navy-900'
              }`}
            >
              {m.body}
              <div className="text-[10px] opacity-60 mt-1">
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        {active && (
          <div className="border-t border-navy-100 p-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Escribe un mensaje…"
            />
            <button
              type="button"
              onClick={send}
              className="bg-navy-900 text-white rounded-lg px-4 text-sm font-medium"
            >
              Enviar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
