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
  formatRank,
} from '@deckora/shared';

/** menu = elegir rapida/privada · quick = elegir modalidad · private = config · lobby · table */
type Flow = 'menu' | 'quick' | 'private' | 'lobby' | 'table';

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
  const [mode, setMode] = useState<'online' | 'private'>('online');
  const [variant, setVariant] = useState<PokerVariant>(RECOMMENDED.variant);
  const [tableSize, setTableSize] = useState(RECOMMENDED.tableSize);
  const [privateMinutes, setPrivateMinutes] = useState(10);
  const [privateCode, setPrivateCode] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [target, setTarget] = useState(6);
  const [isHost, setIsHost] = useState(false);
  const [table, setTable] = useState<PokerView | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [raiseAmt, setRaiseAmt] = useState(20);
  const [err, setErr] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);

  const mmr = 800;
  const rankLabel = useMemo(() => formatRank(mmr, lang), [mmr, lang]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { ok, data } = await api<FriendRow[]>('/api/friends');
      if (ok) setFriends(data);
    })();
  }, [user]);

  function leaveAll() {
    try {
      getSocket().emit('action', { type: 'match:leave' });
    } catch {
      /* */
    }
    setFlow('menu');
    setTable(null);
    setPrivateCode(null);
    setWaiting(0);
    setIsHost(false);
    setErr(null);
  }

  function bindSocket() {
    connectSocket();
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onEvent = (ev: { type: string; payload: unknown }) => {
      if (ev.type === 'match:state') {
        const p = ev.payload as {
          phase?: string;
          players?: { id: string; username: string }[];
          config?: { targetPlayers?: number; privateCode?: string; mode?: string };
          table?: PokerView;
        };
        if (p.config?.privateCode) setPrivateCode(p.config.privateCode);
        if (p.config?.targetPlayers) setTarget(p.config.targetPlayers);
        if (p.players) {
          setWaiting(p.players.length);
          const me = p.players.find((x) => x.username === profile?.username);
          if (me) {
            setMyId(me.id);
            // primer jugador = host en privada
            if (p.players[0]?.id === me.id) setIsHost(true);
          }
        }
        if (p.table) {
          setTable(p.table);
          setFlow('table');
        } else if (p.phase === 'playing') {
          setFlow('table');
        } else {
          setFlow('lobby');
        }
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
    return socket;
  }

  /** Partida rapida: solo modalidad → cola automatica */
  function joinQuick(v: PokerVariant) {
    setVariant(v);
    setMode('online');
    const socket = bindSocket();
    const size = RECOMMENDED.tableSize;
    setTableSize(size);
    setTarget(size);
    socket.emit('action', {
      type: 'match:join',
      payload: {
        config: {
          gameId: 'poker',
          mode: 'online',
          variant: v,
          targetPlayers: size,
          maxPlayers: size,
          minPlayers: size,
          durationMs: ONLINE_MATCH_MS,
          ranked: true,
        },
        username: profile?.username,
        avatarUrl: profile?.avatar_url ?? undefined,
        mmr,
      },
    });
    setFlow('lobby');
  }

  /** Crear sala privada (no empieza sola) */
  function createPrivate() {
    setMode('private');
    setIsHost(true);
    const socket = bindSocket();
    socket.emit('action', {
      type: 'match:join',
      payload: {
        config: {
          gameId: 'poker',
          mode: 'private',
          variant,
          targetPlayers: tableSize,
          maxPlayers: tableSize,
          minPlayers: 2,
          durationMs: privateMinutes * 60 * 1000,
          ranked: false,
        },
        username: profile?.username,
        avatarUrl: profile?.avatar_url ?? undefined,
        mmr,
      },
    });
    setFlow('lobby');
  }

  function joinPrivateCode(code: string) {
    setMode('private');
    const socket = bindSocket();
    socket.emit('action', {
      type: 'match:join',
      payload: {
        code: code.trim().toUpperCase(),
        config: { mode: 'private', gameId: 'poker' },
        username: profile?.username,
        avatarUrl: profile?.avatar_url ?? undefined,
        mmr,
      },
    });
    setFlow('lobby');
  }

  /** Host: empezar ya (rellena huecos con bots si hace falta) */
  function startPrivateNow(fillBots: boolean) {
    getSocket().emit('action', {
      type: 'match:ready',
      payload: { fillBots },
    });
  }

  function inviteFriend(username: string) {
    if (!username) return;
    getSocket().emit('action', { type: 'match:invite', payload: { username } });
    setErr(`Invitacion a ${username}`);
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

  /* ══════════ MESA ══════════ */
  if (flow === 'table' && table) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between mb-4">
          <h1 className="font-brand text-xl text-navy-900">{POKER_VARIANTS[variant].nameEs}</h1>
          <button type="button" onClick={leaveAll} className="text-sm text-navy-600 underline">
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
                  <span>
                    {s.username}
                    {s.isBot ? ' (bot)' : ''}
                  </span>
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

  /* ══════════ LOBBY (esperando / privada) ══════════ */
  if (flow === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <button type="button" onClick={leaveAll} className="text-sm text-navy-500 mb-4">
          ← Cancelar
        </button>

        <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-soft text-center">
          <p className="text-sm text-navy-500 mb-1">
            {mode === 'online' ? 'Partida rapida' : 'Sala privada'} · {POKER_VARIANTS[variant].nameEs}
          </p>
          <p className="text-4xl font-brand text-navy-900 my-3">
            {waiting}
            {mode === 'online' ? ` / ${target}` : ` / ${target}`}
          </p>

          {mode === 'online' ? (
            <p className="text-sm text-navy-600">
              Buscando jugadores de rango cercano…
              <br />
              La mesa empieza sola al llenarse ({target}).
            </p>
          ) : (
            <>
              {privateCode && (
                <p className="font-brand text-2xl tracking-widest text-navy-900 my-2">{privateCode}</p>
              )}
              <p className="text-sm text-navy-600 mb-4">
                Invita amigos o rellena con bots. Empieza cuando quieras.
              </p>

              {isHost && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startPrivateNow(false)}
                    disabled={waiting < 2}
                    className="rounded-lg bg-navy-900 text-white py-2.5 text-sm font-medium disabled:opacity-40"
                  >
                    Empezar ahora
                  </button>
                  <button
                    type="button"
                    onClick={() => startPrivateNow(true)}
                    className="rounded-lg border border-navy-900 text-navy-900 py-2.5 text-sm font-medium"
                  >
                    Empezar y rellenar con bots
                  </button>
                </div>
              )}

              {!isHost && <p className="text-sm text-navy-500">Esperando a que el anfitrion inicie…</p>}
            </>
          )}
        </div>

        {mode === 'private' && (
          <div className="mt-4 rounded-xl border border-navy-100 bg-white p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-navy-900 mb-2">Invitar amigos</h2>
            {friends.length === 0 ? (
              <p className="text-sm text-navy-500">Sin amigos. Anadelos en Amigos.</p>
            ) : (
              <ul className="space-y-2">
                {friends.map((f) => {
                  const label = f.username ?? f.id.slice(0, 8);
                  return (
                    <li key={f.id} className="flex justify-between items-center text-sm">
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => inviteFriend(label)}
                        className="rounded-md bg-navy-900 text-white px-2 py-1 text-xs"
                      >
                        Invitar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
      </div>
    );
  }

  /* ══════════ PARTIDA RAPIDA: elegir modalidad ══════════ */
  if (flow === 'quick') {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <button type="button" onClick={() => setFlow('menu')} className="text-sm text-navy-500 mb-4">
          ← Atras
        </button>
        <h1 className="font-brand text-2xl text-navy-900 mb-1">Partida rapida</h1>
        <p className="text-sm text-navy-500 mb-6">
          Tu rango: <strong className="text-navy-800">{rankLabel}</strong> · 10 min · se une sola a una mesa cercana
        </p>

        <div className="rounded-xl border-2 border-navy-900 bg-navy-900 text-white p-4 mb-4">
          <div className="text-xs uppercase tracking-wide text-navy-300">Recomendado</div>
          <div className="font-semibold mt-1">
            {POKER_VARIANTS[RECOMMENDED.variant].nameEs} · mesa de {RECOMMENDED.tableSize}
          </div>
          <p className="text-sm text-navy-300 mt-1">
            {lang === 'en' ? RECOMMENDED.reasonEn : lang === 'fr' ? RECOMMENDED.reasonFr : RECOMMENDED.reasonEs}
          </p>
          <button
            type="button"
            onClick={() => joinQuick(RECOMMENDED.variant)}
            className="mt-3 w-full rounded-lg bg-white text-navy-900 py-2 text-sm font-medium"
          >
            Jugar recomendado
          </button>
        </div>

        <p className="text-sm font-medium text-navy-800 mb-2">O elige modalidad</p>
        <div className="grid grid-cols-2 gap-3">
          {(['holdem', 'omaha'] as PokerVariant[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => joinQuick(v)}
              className="rounded-xl border border-navy-100 bg-white p-4 text-left shadow-soft hover:border-navy-400"
            >
              <div className="font-semibold text-navy-900">{POKER_VARIANTS[v].nameEs}</div>
              <div className="text-xs text-navy-500 mt-1">Mesa de {RECOMMENDED.tableSize} · espera a llenar</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════ PRIVADA: config ══════════ */
  if (flow === 'private') {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <button type="button" onClick={() => setFlow('menu')} className="text-sm text-navy-500 mb-4">
          ← Atras
        </button>
        <h1 className="font-brand text-2xl text-navy-900 mb-6">Sala privada</h1>

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
            <label className="text-sm font-medium text-navy-800">Jugadores (max)</label>
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
            <label className="text-sm font-medium text-navy-800">Tiempo limite</label>
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
            onClick={createPrivate}
            className="w-full rounded-lg bg-navy-900 text-white py-3 font-medium"
          >
            Crear sala
          </button>

          <div className="pt-3 border-t border-navy-100">
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
                  if (el?.value) joinPrivateCode(el.value);
                }}
                className="rounded-lg border border-navy-900 px-4 text-sm font-medium"
              >
                Unirse
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════ MENU: Rapida | Privada ══════════ */
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-brand text-3xl text-navy-900 mb-2">{t(lang, 'play')}</h1>
      <p className="text-navy-500 text-sm mb-8">
        Rango: <strong className="text-navy-800">{rankLabel}</strong>
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setFlow('quick')}
          className="w-full text-left rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:border-navy-300"
        >
          <div className="font-semibold text-navy-900 text-lg">Partida rapida</div>
          <p className="text-sm text-navy-500 mt-1">
            Eliges Hold'em u Omaha y entras en cola. Cuando se llena la mesa, empieza.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFlow('private')}
          className="w-full text-left rounded-xl border border-navy-100 bg-white p-5 shadow-soft hover:border-navy-300"
        >
          <div className="font-semibold text-navy-900 text-lg">Sala privada</div>
          <p className="text-sm text-navy-500 mt-1">
            Modalidad, jugadores, tiempo, invitaciones. Empiezas tu; puedes rellenar con bots.
          </p>
        </button>
      </div>
    </div>
  );
}
