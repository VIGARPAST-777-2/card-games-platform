import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSocket, connectSocket } from '../lib/socket';
import { api } from '../lib/api';
import { t } from '../i18n';
import { PlayingCard } from '../components/Icons';
import {
  RECOMMENDED,
  TABLE_SIZES,
  PRIVATE_TIME_OPTIONS_MIN,
  ONLINE_MATCH_MS,
  POKER_VARIANTS,
  type PokerVariant,
} from '@deckora/shared';
import { formatRank } from '@deckora/shared';

type Flow = 'menu' | 'online' | 'private' | 'table';

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

interface FriendRow {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  username?: string;
}

export function PlayPage() {
  const { user, profile, lang } = useAuthStore();
  const [flow, setFlow] = useState<Flow>('menu');
  const [variant, setVariant] = useState<PokerVariant>(RECOMMENDED.variant);
  const [tableSize, setTableSize] = useState<number>(RECOMMENDED.tableSize);
  const [privateMinutes, setPrivateMinutes] = useState(10);
  const [privateCode, setPrivateCode] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [target, setTarget] = useState(6);
  const [table, setTable] = useState<PokerView | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [raiseAmt, setRaiseAmt] = useState(20);
  const [err, setErr] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);

  const mmr = 800; // default hasta cargar player_ranks
  const rankLabel = useMemo(() => formatRank(mmr, lang), [mmr, lang]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { ok, data } = await api<FriendRow[]>('/api/friends');
      if (ok) setFriends(data.filter((f) => f.status === 'accepted' || f.status === 'pending'));
    })();
  }, [user]);

  function leaveTable() {
    try {
      getSocket().emit('action', { type: 'match:leave' });
    } catch {
      /* */
    }
    setFlow('menu');
    setTable(null);
    setPrivateCode(null);
    setMatchId(null);
    setWaiting(0);
  }

  function startMatch(mode: 'online' | 'private', joinCode?: string) {
    if (!user) return;
    connectSocket();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const durationMs = mode === 'online' ? ONLINE_MATCH_MS : privateMinutes * 60 * 1000;

    const onEvent = (ev: { type: string; payload: unknown }) => {
      if (ev.type === 'match:state') {
        const p = ev.payload as {
          matchId?: string;
          phase?: string;
          players?: { id: string; username: string }[];
          config?: { targetPlayers?: number; privateCode?: string };
          table?: PokerView;
        };
        if (p.matchId) setMatchId(p.matchId);
        if (p.config?.privateCode) setPrivateCode(p.config.privateCode);
        if (p.config?.targetPlayers) setTarget(p.config.targetPlayers);
        if (p.players) {
          setWaiting(p.players.length);
          const me = p.players.find((x) => x.username === profile?.username);
          if (me) setMyId(me.id);
        }
        if (p.table) setTable(p.table);
        if (p.phase === 'playing' || p.table) setFlow('table');
        else setFlow(mode === 'private' ? 'private' : 'online');
      }
      if (ev.type === 'match:action_result') {
        const r = ev.payload as { success: boolean; error?: string };
        if (!r.success) setErr(r.error ?? 'Error');
      }
    };

    socket.off('event');
    socket.on('event', onEvent);
    socket.on('poker:public', (v: PokerView) => {
      setTable(v);
      setFlow('table');
    });

    socket.emit('action', {
      type: 'match:join',
      payload: {
        code: joinCode,
        config: {
          gameId: 'poker',
          mode,
          variant,
          targetPlayers: tableSize,
          maxPlayers: tableSize,
          minPlayers: tableSize,
          durationMs,
          ranked: mode === 'online',
        },
        username: profile?.username,
        avatarUrl: profile?.avatar_url ?? undefined,
        mmr,
      },
    });
  }

  function inviteFriend(username: string) {
    getSocket().emit('action', { type: 'match:invite', payload: { username } });
    setErr(`Invitacion enviada a ${username}`);
  }

  function act(action: string, data?: { raiseTo?: number }) {
    getSocket().emit('action', { type: 'match:action', payload: { action, data } });
  }

  const mySeat = table?.seats.find((s) => s.playerId === myId);
  const isTurn = table?.currentPlayerId === myId;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-navy-600 mb-4">{t(lang, 'login')}</p>
        <Link to="/auth" className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-medium">
          {t(lang, 'login')}
        </Link>
      </div>
    );
  }

  /* ── Mesa en juego ── */
  if (flow === 'table' && table) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between mb-4">
          <h1 className="font-brand text-xl text-navy-900">
            {POKER_VARIANTS[variant].nameEs}
          </h1>
          <button type="button" onClick={leaveTable} className="text-sm text-navy-600 underline">
            Salir
          </button>
        </div>
        {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
        <div className="rounded-2xl bg-navy-900 text-white p-6 shadow-card min-h-[320px]">
          <div className="text-center text-navy-300 text-sm mb-4">
            {t(lang, 'pot')}: <span className="text-white font-semibold">{table.pot}</span>
            <span className="mx-2">·</span>
            {table.phase}
          </div>
          <div className="flex justify-center gap-2 mb-8 min-h-[5.5rem] flex-wrap">
            {table.community?.length ? (
              table.community.map((c, i) => <PlayingCard key={i} rank={c.rank} suit={c.suit} />)
            ) : (
              <span className="text-navy-500 text-sm">—</span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {table.seats.map((s) => (
              <div
                key={s.playerId}
                className={`rounded-lg border px-3 py-2 ${
                  s.playerId === table.currentPlayerId ? 'border-gold-400 bg-navy-800' : 'border-navy-700'
                } ${s.folded ? 'opacity-40' : ''}`}
              >
                <div className="flex justify-between text-sm">
                  <span>{s.username}</span>
                  <span>{s.chips}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {s.hole?.length
                    ? s.hole.map((c, i) => (
                        <PlayingCard key={i} rank={c.rank} suit={c.suit} className="!w-10 !h-14" />
                      ))
                    : Array.from({ length: s.holeCount || 0 }).map((_, i) => (
                        <PlayingCard key={i} hidden className="!w-10 !h-14" />
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {isTurn && mySeat && !mySeat.folded && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => act('fold')} className="rounded-lg border border-navy-200 px-4 py-2 text-sm">
              {t(lang, 'fold')}
            </button>
            <button type="button" onClick={() => act('check')} className="rounded-lg border border-navy-200 px-4 py-2 text-sm">
              {t(lang, 'check')}
            </button>
            <button type="button" onClick={() => act('call')} className="rounded-lg bg-navy-800 text-white px-4 py-2 text-sm">
              {t(lang, 'call')}
            </button>
            <input
              type="number"
              value={raiseAmt}
              onChange={(e) => setRaiseAmt(Number(e.target.value))}
              className="w-24 border rounded-lg px-2 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => act('raise', { raiseTo: raiseAmt })}
              className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm"
            >
              {t(lang, 'raise')}
            </button>
            <button type="button" onClick={() => act('allin')} className="rounded-lg border border-navy-900 px-4 py-2 text-sm">
              {t(lang, 'allin')}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Online config / waiting ── */
  if (flow === 'online') {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <button type="button" onClick={leaveTable} className="text-sm text-navy-500 mb-4">
          ← {t(lang, 'play')}
        </button>
        <h1 className="font-brand text-2xl text-navy-900 mb-1">Partida en linea</h1>
        <p className="text-sm text-navy-500 mb-6">
          Tu rango: <strong className="text-navy-800">{rankLabel}</strong> · 10 min · empareja cercanos
        </p>

        {waiting > 0 ? (
          <div className="rounded-xl border border-navy-100 bg-white p-6 text-center shadow-soft">
            <p className="text-navy-800 font-medium mb-2">Buscando mesa…</p>
            <p className="text-3xl font-brand text-navy-900">
              {waiting} / {target}
            </p>
            <p className="text-sm text-navy-500 mt-2">La partida empieza al completar la mesa</p>
            <button type="button" onClick={leaveTable} className="mt-4 text-sm underline text-navy-600">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border-2 border-navy-900 bg-navy-900 text-white p-4">
              <div className="text-xs uppercase tracking-wide text-navy-300 mb-1">Recomendado</div>
              <div className="font-semibold">
                {POKER_VARIANTS[RECOMMENDED.variant].nameEs} · {RECOMMENDED.tableSize} jugadores
              </div>
              <p className="text-sm text-navy-300 mt-1">
                {lang === 'en' ? RECOMMENDED.reasonEn : lang === 'fr' ? RECOMMENDED.reasonFr : RECOMMENDED.reasonEs}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVariant(RECOMMENDED.variant);
                  setTableSize(RECOMMENDED.tableSize);
                  startMatch('online');
                }}
                className="mt-3 w-full rounded-lg bg-white text-navy-900 py-2 text-sm font-medium"
              >
                Jugar recomendado
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-navy-800">Modalidad</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['holdem', 'omaha'] as PokerVariant[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      variant === v ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white'
                    }`}
                  >
                    {POKER_VARIANTS[v].nameEs}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-navy-800">Jugadores en mesa</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TABLE_SIZES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTableSize(n)}
                    className={`w-12 h-10 rounded-lg border text-sm font-medium ${
                      tableSize === n ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => startMatch('online')}
              className="w-full rounded-lg bg-navy-900 text-white py-3 font-medium"
            >
              Buscar mesa
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Privada ── */
  if (flow === 'private') {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <button type="button" onClick={leaveTable} className="text-sm text-navy-500 mb-4">
          ← {t(lang, 'play')}
        </button>
        <h1 className="font-brand text-2xl text-navy-900 mb-6">Sala privada</h1>

        {privateCode || waiting > 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-navy-100 bg-white p-5 text-center shadow-soft">
              <p className="text-sm text-navy-500">Codigo de sala</p>
              <p className="font-brand text-3xl tracking-widest text-navy-900 my-2">{privateCode ?? '…'}</p>
              <p className="text-navy-700">
                {waiting} / {target} jugadores
              </p>
              <p className="text-xs text-navy-400 mt-1">Empieza al completar</p>
            </div>

            <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-soft">
              <h2 className="text-sm font-semibold text-navy-900 mb-2">Invitar amigos</h2>
              {friends.length === 0 ? (
                <p className="text-sm text-navy-500">Sin amigos en lista. Anade desde Amigos.</p>
              ) : (
                <ul className="space-y-2">
                  {friends.map((f) => (
                    <li key={f.id} className="flex justify-between items-center text-sm">
                      <span className="text-navy-800">{f.username ?? f.id.slice(0, 8)}</span>
                      <button
                        type="button"
                        onClick={() => inviteFriend(f.username ?? '')}
                        className="rounded-md bg-navy-900 text-white px-2 py-1 text-xs"
                      >
                        Invitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-navy-400 mt-3">
                Tambien puedes compartir el codigo. Si instalaste la PWA, la invitacion puede llegar como notificacion.
              </p>
            </div>

            <button type="button" onClick={leaveTable} className="text-sm underline text-navy-600">
              Cancelar sala
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-navy-800">Modalidad</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['holdem', 'omaha'] as PokerVariant[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      variant === v ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white'
                    }`}
                  >
                    {POKER_VARIANTS[v].nameEs}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-800">Jugadores</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TABLE_SIZES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTableSize(n)}
                    className={`w-12 h-10 rounded-lg border text-sm ${
                      tableSize === n ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-800">Limite de tiempo</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PRIVATE_TIME_OPTIONS_MIN.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPrivateMinutes(m)}
                    className={`px-3 h-10 rounded-lg border text-sm ${
                      privateMinutes === m ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-200 bg-white'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => startMatch('private')}
              className="w-full rounded-lg bg-navy-900 text-white py-3 font-medium"
            >
              Crear sala
            </button>
            <div className="pt-2 border-t border-navy-100">
              <label className="text-sm font-medium text-navy-800">Unirse con codigo</label>
              <div className="flex gap-2 mt-1">
                <input
                  id="join-code"
                  className="flex-1 border border-navy-200 rounded-lg px-3 py-2 uppercase"
                  placeholder="ABC123"
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('join-code') as HTMLInputElement;
                    if (el?.value) startMatch('private', el.value.trim().toUpperCase());
                  }}
                  className="rounded-lg border border-navy-900 px-4 text-sm font-medium"
                >
                  Unirse
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Menu principal Jugar ── */
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-brand text-3xl text-navy-900 mb-2">{t(lang, 'play')}</h1>
      <p className="text-navy-500 text-sm mb-8">
        Rango actual: <strong className="text-navy-800">{rankLabel}</strong>
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setFlow('online')}
          className="w-full text-left rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:border-navy-300 transition-colors"
        >
          <div className="font-semibold text-navy-900 text-lg">Partida en linea</div>
          <p className="text-sm text-navy-500 mt-1">
            Hold'em u Omaha · 10 min · empareja por rango cercano · elige tamano de mesa
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFlow('private')}
          className="w-full text-left rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:border-navy-300 transition-colors"
        >
          <div className="font-semibold text-navy-900 text-lg">Crear sala privada</div>
          <p className="text-sm text-navy-500 mt-1">
            Modalidad, tiempo, jugadores e invita a amigos
          </p>
        </button>
      </div>

      {err && <p className="mt-4 text-sm text-red-700">{err}</p>}
      {matchId && (
        <p className="mt-2 text-xs text-navy-400">Match {matchId.slice(0, 8)}</p>
      )}
    </div>
  );
}
