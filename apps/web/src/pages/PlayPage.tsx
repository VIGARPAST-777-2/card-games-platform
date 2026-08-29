import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../lib/socket';
import { t } from '../i18n';
import { PlayingCard } from '../components/Icons';

interface SeatView {
  playerId: string;
  username: string;
  chips: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  hole: { rank: string; suit: string }[];
  holeCount: number;
  isBot: boolean;
}

interface PokerView {
  phase: string;
  community: { rank: string; suit: string }[];
  pot: number;
  currentPlayerId?: string;
  seats: SeatView[];
}

export function PlayPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'quick';
  const code = params.get('code') ?? undefined;
  const { user, profile, lang } = useAuthStore();
  const [table, setTable] = useState<PokerView | null>(null);
  const [joined, setJoined] = useState(false);
  const [raiseAmt, setRaiseAmt] = useState(20);
  const [err, setErr] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onEvent = (ev: { type: string; payload: unknown }) => {
      if (ev.type === 'match:state') {
        const p = ev.payload as { table?: PokerView; players?: { id: string; username: string }[] };
        if (p.table) setTable(p.table as PokerView);
        if (profile && p.players) {
          const me = p.players.find((x) => x.username === profile.username);
          if (me) setMyId(me.id);
        }
      }
      if (ev.type === 'match:action_result') {
        const r = ev.payload as { success: boolean; error?: string };
        if (!r.success) setErr(r.error ?? 'Error');
        else setErr(null);
      }
    };
    socket.on('event', onEvent);
    socket.on('poker:public', (v: PokerView) => setTable(v));

    socket.emit('action', {
      type: 'match:join',
      payload: {
        code,
        config: { gameId: 'poker', mode, maxPlayers: mode === 'bot' ? 4 : 6 },
        username: profile?.username,
        avatarUrl: profile?.avatar_url,
      },
    });
    setJoined(true);

    return () => {
      socket.emit('action', { type: 'match:leave' });
      socket.off('event', onEvent);
      socket.off('poker:public');
    };
  }, [mode, code, profile?.username]);

  function act(action: string, data?: { raiseTo?: number }) {
    getSocket().emit('action', { type: 'match:action', payload: { action, data } });
  }

  const mySeat = table?.seats.find((s) => s.playerId === myId);
  const isTurn = table?.currentPlayerId === myId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-brand text-2xl text-navy-900">Texas Hold'em</h1>
          <p className="text-sm text-navy-500">
            {t(lang, mode === 'bot' ? 'bots' : mode === 'ranked' ? 'ranked' : mode === 'private' ? 'private' : mode === 'friendly' ? 'friendly' : 'quick')}
          </p>
        </div>
        <Link to="/" className="text-sm text-navy-600 underline">
          {t(lang, 'home')}
        </Link>
      </div>

      {!user && (
        <p className="mb-4 text-sm text-navy-600">
          <Link to="/auth" className="underline">{t(lang, 'login')}</Link>
        </p>
      )}

      {err && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2">{err}</p>}

      <div className="rounded-2xl bg-navy-900 text-white p-6 shadow-card min-h-[320px]">
        <div className="text-center text-navy-300 text-sm mb-4">
          {table ? (
            <>
              {t(lang, 'pot')}: <span className="text-white font-semibold">{table.pot}</span>
              <span className="mx-2">·</span>
              {table.phase}
            </>
          ) : (
            t(lang, 'waiting')
          )}
        </div>

        <div className="flex justify-center gap-2 mb-8 min-h-[5.5rem]">
          {(table?.community?.length ? table.community : [null, null, null, null, null].slice(0, 0)).map((c, i) =>
            c ? <PlayingCard key={i} rank={c.rank} suit={c.suit} /> : null
          )}
          {table && table.community.length === 0 && (
            <span className="text-navy-500 text-sm self-center">—</span>
          )}
          {table?.community.map((c, i) => (
            <PlayingCard key={`c${i}`} rank={c.rank} suit={c.suit} />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {table?.seats.map((s) => (
            <div
              key={s.playerId}
              className={`rounded-lg border px-3 py-2 ${
                s.playerId === table.currentPlayerId
                  ? 'border-gold-400 bg-navy-800'
                  : 'border-navy-700 bg-navy-950/50'
              } ${s.folded ? 'opacity-40' : ''}`}
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{s.username}{s.isBot ? ' (bot)' : ''}</span>
                <span>{s.chips}</span>
              </div>
              {s.bet > 0 && <div className="text-xs text-navy-300">Bet {s.bet}</div>}
              <div className="flex gap-1 mt-2">
                {s.hole?.length
                  ? s.hole.map((c, i) => <PlayingCard key={i} rank={c.rank} suit={c.suit} className="!w-10 !h-14" />)
                  : Array.from({ length: s.holeCount || 0 }).map((_, i) => (
                      <PlayingCard key={i} hidden className="!w-10 !h-14" />
                    ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {joined && isTurn && mySeat && !mySeat.folded && (
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => act('fold')} className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900">
            {t(lang, 'fold')}
          </button>
          <button type="button" onClick={() => act('check')} className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900">
            {t(lang, 'check')}
          </button>
          <button type="button" onClick={() => act('call')} className="rounded-lg bg-navy-800 text-white px-4 py-2 text-sm font-medium">
            {t(lang, 'call')}
          </button>
          <input
            type="number"
            min={10}
            value={raiseAmt}
            onChange={(e) => setRaiseAmt(Number(e.target.value))}
            className="w-24 border border-navy-200 rounded-lg px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => act('raise', { raiseTo: raiseAmt })}
            className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-medium"
          >
            {t(lang, 'raise')}
          </button>
          <button type="button" onClick={() => act('allin')} className="rounded-lg border border-navy-900 px-4 py-2 text-sm font-medium text-navy-900">
            {t(lang, 'allin')}
          </button>
          <span className="text-xs text-navy-500 ml-2">{t(lang, 'yourTurn')}</span>
        </div>
      )}

      {mode === 'private' && (
        <p className="mt-4 text-sm text-navy-500">
          {lang === 'en' ? 'Share the private code from the table host when available.' : 'Comparte el codigo de sala privada cuando este disponible.'}
        </p>
      )}
    </div>
  );
}
