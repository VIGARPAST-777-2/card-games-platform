import { useEffect, useMemo } from 'react';
import { PlayingCard } from './Icons';

export interface SeatView {
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

export interface PokerView {
  phase: string;
  community: { rank: string; suit: string }[];
  pot: number;
  currentPlayerId?: string;
  seats: SeatView[];
}

interface Props {
  table: PokerView;
  myId: string | null;
  variantLabel: string;
  onLeave: () => void;
  onAct: (action: string, data?: { raiseTo?: number }) => void;
  labels: {
    fold: string;
    check: string;
    call: string;
    raise: string;
    allin: string;
    pot: string;
  };
  raiseAmt: number;
  setRaiseAmt: (n: number) => void;
}

/** Posiciones en el ovalo (porcentaje left/top del felt) para hasta 9 asientos */
function seatStyle(index: number, total: number): React.CSSProperties {
  // Angulos desde abajo (jugador local preferente)
  const start = 90; // grados: abajo
  const step = 360 / Math.max(total, 1);
  const angle = ((start + index * step) * Math.PI) / 180;
  const x = 50 + 42 * Math.cos(angle);
  const y = 50 + 38 * Math.sin(angle);
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
  };
}

export function PokerTable({ table, myId, variantLabel, onLeave, onAct, labels, raiseAmt, setRaiseAmt }: Props) {
  const mySeat = table.seats.find((s) => s.playerId === myId);
  const isTurn = table.currentPlayerId === myId && mySeat && !mySeat.folded;

  // Orden: poner al jugador local abajo si existe
  const ordered = useMemo(() => {
    const seats = [...table.seats];
    if (!myId) return seats;
    const i = seats.findIndex((s) => s.playerId === myId);
    if (i <= 0) return seats;
    return [...seats.slice(i), ...seats.slice(0, i)];
  }, [table.seats, myId]);

  useEffect(() => {
    // Intentar fullscreen al montar
    const el = document.documentElement;
    const req =
      el.requestFullscreen?.bind(el) ||
      (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(el);
    try {
      req?.();
    } catch {
      /* */
    }
    // Preferir landscape si la API existe
    try {
      const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
      o?.lock?.('landscape').catch(() => undefined);
    } catch {
      /* */
    }
    return () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen?.();
      } catch {
        /* */
      }
    };
  }, []);

  return (
    <div className="poker-fs">
      <div className="poker-rotate-hint">
        <div>
          <p className="font-brand text-xl mb-2">Gira el dispositivo</p>
          <p className="text-navy-200 text-sm">La partida se juega en horizontal a pantalla completa.</p>
        </div>
      </div>

      {/* Barra superior */}
      <div className="flex items-center justify-between px-3 py-2 text-white text-sm shrink-0">
        <span className="font-brand">{variantLabel}</span>
        <span className="text-navy-300 uppercase text-xs tracking-wide">{table.phase}</span>
        <button type="button" onClick={onLeave} className="underline text-navy-200 hover:text-white">
          Salir
        </button>
      </div>

      {/* Felt */}
      <div className="poker-felt">
        {/* Bote centro */}
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <div className="anim-pot text-amber-200/90 text-xs uppercase tracking-wider">{labels.pot}</div>
          <div className="text-white text-2xl font-semibold anim-chip">{table.pot}</div>
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap max-w-[280px]">
            {table.community?.map((c, i) => (
              <div key={`${c.rank}${c.suit}${i}`} className="anim-deal" style={{ animationDelay: `${i * 80}ms` }}>
                <PlayingCard rank={c.rank} suit={c.suit} className="!w-12 !h-[4.25rem] sm:!w-14 sm:!h-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Asientos alrededor */}
        {ordered.map((s, idx) => {
          const isMe = s.playerId === myId;
          const turn = s.playerId === table.currentPlayerId;
          return (
            <div
              key={s.playerId}
              className={`absolute z-20 flex flex-col items-center ${s.folded ? 'opacity-45' : ''}`}
              style={seatStyle(idx, ordered.length)}
            >
              <div
                className={`rounded-full w-11 h-11 flex items-center justify-center text-sm font-semibold border-2 ${
                  turn ? 'anim-seat-turn border-gold-400 bg-navy-800 text-white' : 'border-navy-600 bg-navy-950 text-navy-100'
                }`}
              >
                {(s.username || '?')[0]?.toUpperCase()}
              </div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] sm:text-xs whitespace-nowrap max-w-[7rem] truncate">
                {s.username}
                {s.isBot ? ' · bot' : ''}
                {isMe ? ' · tu' : ''}
              </div>
              <div className="text-[10px] text-amber-100/90">{s.chips}</div>
              {s.bet > 0 && (
                <div className="anim-chip text-[10px] text-white bg-navy-900/80 rounded-full px-2 py-0.5 mt-0.5">
                  {s.bet}
                </div>
              )}
              <div className="flex gap-0.5 mt-1">
                {s.hole?.length
                  ? s.hole.map((c, i) => (
                      <div key={i} className="anim-deal" style={{ animationDelay: `${i * 60}ms` }}>
                        <PlayingCard rank={c.rank} suit={c.suit} className="!w-8 !h-11" />
                      </div>
                    ))
                  : Array.from({ length: s.holeCount || 0 }).map((_, i) => (
                      <PlayingCard key={i} hidden className="!w-8 !h-11" />
                    ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        {isTurn ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onAct('fold')}
              className="rounded-lg bg-navy-800 text-white px-4 py-2 text-sm border border-navy-600"
            >
              {labels.fold}
            </button>
            <button
              type="button"
              onClick={() => onAct('check')}
              className="rounded-lg bg-navy-800 text-white px-4 py-2 text-sm border border-navy-600"
            >
              {labels.check}
            </button>
            <button
              type="button"
              onClick={() => onAct('call')}
              className="rounded-lg bg-navy-700 text-white px-4 py-2 text-sm"
            >
              {labels.call}
            </button>
            <input
              type="number"
              value={raiseAmt}
              onChange={(e) => setRaiseAmt(Number(e.target.value))}
              className="w-20 rounded-lg px-2 py-2 text-sm bg-navy-950 text-white border border-navy-600"
            />
            <button
              type="button"
              onClick={() => onAct('raise', { raiseTo: raiseAmt })}
              className="rounded-lg bg-gold-500 text-navy-950 px-4 py-2 text-sm font-medium"
            >
              {labels.raise}
            </button>
            <button
              type="button"
              onClick={() => onAct('allin')}
              className="rounded-lg border border-gold-400 text-gold-400 px-4 py-2 text-sm"
            >
              {labels.allin}
            </button>
          </div>
        ) : (
          <p className="text-center text-navy-400 text-sm py-2">
            {table.currentPlayerId ? 'Esperando accion…' : '—'}
          </p>
        )}
      </div>
    </div>
  );
}
