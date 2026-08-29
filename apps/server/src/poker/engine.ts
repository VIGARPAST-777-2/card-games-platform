import { createShuffledDeck, getCardValue } from '@deckora/shared';
import type { Card } from '@deckora/shared';

export type PokerPhase =
  | 'waiting'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'finished';

export type PokerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface PokerSeat {
  playerId: string;
  username: string;
  chips: number;
  bet: number;
  totalBet: number;
  hole: Card[];
  folded: boolean;
  allIn: boolean;
  isBot: boolean;
  seat: number;
}

export interface PokerTable {
  deck: Card[];
  community: Card[];
  seats: PokerSeat[];
  pot: number;
  phase: PokerPhase;
  dealerIndex: number;
  currentIndex: number;
  currentBet: number;
  minRaise: number;
  smallBlind: number;
  bigBlind: number;
  handNumber: number;
  holeCards: number;
}

export function evaluateHand(cards: Card[]): { score: number; name: string } {
  if (cards.length < 5) return { score: 0, name: 'incomplete' };
  const vals = cards.map((c) => getCardValue(c, true)).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const counts = new Map<number, number>();
  for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const isFlush = suitsFlush(suits);
  const uniqueSorted = [...new Set(vals)].sort((a, b) => b - a);
  const straightHigh = straightHighFn(uniqueSorted);

  if (isFlush && straightHigh === 14) return { score: 8e12 + 14, name: 'royal_flush' };
  if (isFlush && straightHigh) return { score: 8e12 + straightHigh, name: 'straight_flush' };
  if (groups[0][1] === 4) return { score: 7e12 + groups[0][0] * 100 + (groups[1]?.[0] ?? 0), name: 'four_kind' };
  if (groups[0][1] === 3 && groups[1]?.[1] >= 2)
    return { score: 6e12 + groups[0][0] * 100 + groups[1][0], name: 'full_house' };
  if (isFlush) return { score: 5e12 + vals.slice(0, 5).reduce((s, v, i) => s + v * 15 ** (4 - i), 0), name: 'flush' };
  if (straightHigh) return { score: 4e12 + straightHigh, name: 'straight' };
  if (groups[0][1] === 3)
    return { score: 3e12 + groups[0][0] * 1e4 + kickers(groups, 2), name: 'three_kind' };
  if (groups[0][1] === 2 && groups[1]?.[1] === 2)
    return {
      score:
        2e12 +
        Math.max(groups[0][0], groups[1][0]) * 1e4 +
        Math.min(groups[0][0], groups[1][0]) * 100 +
        (groups[2]?.[0] ?? 0),
      name: 'two_pair',
    };
  if (groups[0][1] === 2) return { score: 1e12 + groups[0][0] * 1e4 + kickers(groups, 3), name: 'pair' };
  return { score: vals.slice(0, 5).reduce((s, v, i) => s + v * 15 ** (4 - i), 0), name: 'high_card' };
}

function suitsFlush(suits: string[]): boolean {
  const m = new Map<string, number>();
  for (const s of suits) m.set(s, (m.get(s) ?? 0) + 1);
  return [...m.values()].some((n) => n >= 5);
}

function straightHighFn(uniqueDesc: number[]): number | null {
  const set = new Set(uniqueDesc);
  if ([14, 5, 4, 3, 2].every((x) => set.has(x))) return 5;
  for (let h = 14; h >= 5; h--) {
    if ([h, h - 1, h - 2, h - 3, h - 4].every((x) => set.has(x))) return h;
  }
  return null;
}

function kickers(groups: [number, number][], n: number): number {
  const kicks = groups.filter((g) => g[1] === 1).map((g) => g[0]);
  return kicks.slice(0, n).reduce((s, v, i) => s + v * 15 ** (n - 1 - i), 0);
}

export function createTable(
  seats: Omit<PokerSeat, 'hole' | 'bet' | 'totalBet' | 'folded' | 'allIn'>[],
  blinds = { sb: 5, bb: 10 }
): PokerTable {
  return {
    deck: [],
    community: [],
    seats: seats.map((s) => ({
      ...s,
      hole: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
    })),
    pot: 0,
    phase: 'waiting',
    dealerIndex: 0,
    currentIndex: 0,
    currentBet: 0,
    minRaise: blinds.bb,
    smallBlind: blinds.sb,
    bigBlind: blinds.bb,
    handNumber: 0,
    holeCards: 2,
  };
}

/** holeCards: 2 Hold'em, 4 Omaha */
export function startHand(table: PokerTable, holeCards = 2): PokerTable {
  const t = structuredClone(table) as PokerTable;
  t.holeCards = holeCards;
  t.deck = createShuffledDeck();
  t.community = [];
  t.pot = 0;
  t.currentBet = 0;
  t.minRaise = t.bigBlind;
  t.handNumber += 1;
  t.phase = 'preflop';
  for (const s of t.seats) {
    s.hole = [];
    s.bet = 0;
    s.totalBet = 0;
    s.folded = false;
    s.allIn = false;
  }
  for (let i = 0; i < holeCards; i++) {
    for (const s of t.seats) {
      if (s.chips > 0) s.hole.push(t.deck.pop()!);
    }
  }
  const n = t.seats.length;
  const sbI = (t.dealerIndex + 1) % n;
  const bbI = (t.dealerIndex + 2) % n;
  postBlind(t, sbI, t.smallBlind);
  postBlind(t, bbI, t.bigBlind);
  t.currentBet = t.bigBlind;
  t.currentIndex = (bbI + 1) % n;
  advanceToNextActor(t);
  return t;
}

function postBlind(t: PokerTable, idx: number, amount: number) {
  const s = t.seats[idx];
  const pay = Math.min(amount, s.chips);
  s.chips -= pay;
  s.bet += pay;
  s.totalBet += pay;
  t.pot += pay;
  if (s.chips === 0) s.allIn = true;
}

function advanceToNextActor(t: PokerTable) {
  const n = t.seats.length;
  for (let i = 0; i < n; i++) {
    t.currentIndex = t.currentIndex % n;
    const s = t.seats[t.currentIndex];
    if (!s.folded && !s.allIn && s.chips > 0) return;
    t.currentIndex = (t.currentIndex + 1) % n;
  }
}

export function applyAction(
  table: PokerTable,
  playerId: string,
  action: PokerAction,
  raiseTo?: number
): { ok: boolean; error?: string; table: PokerTable } {
  const t = structuredClone(table) as PokerTable;
  const seat = t.seats.find((s) => s.playerId === playerId);
  if (!seat) return { ok: false, error: 'Player not found', table };
  if (t.seats[t.currentIndex]?.playerId !== playerId) {
    return { ok: false, error: 'Not your turn', table };
  }
  if (seat.folded || seat.allIn) return { ok: false, error: 'Cannot act', table };

  const toCall = t.currentBet - seat.bet;

  if (action === 'fold') {
    seat.folded = true;
  } else if (action === 'check') {
    if (toCall > 0) return { ok: false, error: 'Must call or fold', table };
  } else if (action === 'call') {
    const pay = Math.min(toCall, seat.chips);
    seat.chips -= pay;
    seat.bet += pay;
    seat.totalBet += pay;
    t.pot += pay;
    if (seat.chips === 0) seat.allIn = true;
  } else if (action === 'raise') {
    const target = raiseTo ?? t.currentBet + t.minRaise;
    if (target < t.currentBet + t.minRaise && target < seat.bet + seat.chips) {
      return { ok: false, error: 'Raise too small', table };
    }
    const need = target - seat.bet;
    const pay = Math.min(need, seat.chips);
    seat.chips -= pay;
    seat.bet += pay;
    seat.totalBet += pay;
    t.pot += pay;
    t.minRaise = Math.max(t.minRaise, seat.bet - t.currentBet);
    t.currentBet = Math.max(t.currentBet, seat.bet);
    if (seat.chips === 0) seat.allIn = true;
  } else if (action === 'allin') {
    const pay = seat.chips;
    seat.bet += pay;
    seat.totalBet += pay;
    t.pot += pay;
    seat.chips = 0;
    seat.allIn = true;
    if (seat.bet > t.currentBet) {
      t.minRaise = Math.max(t.minRaise, seat.bet - t.currentBet);
      t.currentBet = seat.bet;
    }
  } else {
    return { ok: false, error: 'Invalid action', table };
  }

  t.currentIndex = (t.currentIndex + 1) % t.seats.length;
  if (bettingRoundComplete(t)) progressStreet(t);
  else advanceToNextActor(t);
  return { ok: true, table: t };
}

function bettingRoundComplete(t: PokerTable): boolean {
  const live = t.seats.filter((s) => !s.folded);
  if (live.length <= 1) return true;
  const actors = live.filter((s) => !s.allIn);
  if (actors.length === 0) return true;
  return actors.every((s) => s.bet === t.currentBet);
}

function progressStreet(t: PokerTable) {
  for (const s of t.seats) s.bet = 0;
  t.currentBet = 0;

  const live = t.seats.filter((s) => !s.folded);
  if (live.length === 1) {
    live[0].chips += t.pot;
    t.pot = 0;
    t.phase = 'finished';
    return;
  }

  if (t.phase === 'preflop') {
    t.community.push(t.deck.pop()!, t.deck.pop()!, t.deck.pop()!);
    t.phase = 'flop';
  } else if (t.phase === 'flop') {
    t.community.push(t.deck.pop()!);
    t.phase = 'turn';
  } else if (t.phase === 'turn') {
    t.community.push(t.deck.pop()!);
    t.phase = 'river';
  } else if (t.phase === 'river') {
    t.phase = 'showdown';
    resolveShowdown(t);
    return;
  }

  t.currentIndex = (t.dealerIndex + 1) % t.seats.length;
  advanceToNextActor(t);
}

function resolveShowdown(t: PokerTable) {
  const live = t.seats.filter((s) => !s.folded);
  let best = -1;
  let winners: PokerSeat[] = [];
  for (const s of live) {
    // Hold'em: best 5 of hole+board. Omaha simplified: best 5 of all (full Omaha rules later)
    const { score } = evaluateHand([...s.hole, ...t.community]);
    if (score > best) {
      best = score;
      winners = [s];
    } else if (score === best) winners.push(s);
  }
  const share = Math.floor(t.pot / Math.max(1, winners.length));
  for (const w of winners) w.chips += share;
  t.pot = 0;
  t.phase = 'finished';
}

export function publicView(t: PokerTable, viewerId?: string) {
  return {
    phase: t.phase,
    community: t.community,
    pot: t.pot,
    currentBet: t.currentBet,
    currentPlayerId: t.seats[t.currentIndex]?.playerId,
    dealerIndex: t.dealerIndex,
    handNumber: t.handNumber,
    smallBlind: t.smallBlind,
    bigBlind: t.bigBlind,
    seats: t.seats.map((s) => ({
      playerId: s.playerId,
      username: s.username,
      chips: s.chips,
      bet: s.bet,
      folded: s.folded,
      allIn: s.allIn,
      isBot: s.isBot,
      seat: s.seat,
      hole: s.playerId === viewerId || t.phase === 'showdown' || t.phase === 'finished' ? s.hole : [],
      holeCount: s.hole.length,
    })),
  };
}

export function simpleBotAction(t: PokerTable, playerId: string): { action: PokerAction; raiseTo?: number } {
  const seat = t.seats.find((s) => s.playerId === playerId)!;
  const toCall = t.currentBet - seat.bet;
  const { score } = evaluateHand([...seat.hole, ...t.community]);
  if (toCall === 0) {
    if (score > 1e12 && Math.random() > 0.5) {
      return { action: 'raise', raiseTo: t.currentBet + t.minRaise };
    }
    return { action: 'check' };
  }
  if (score < 5e11 && toCall > seat.chips * 0.3) return { action: 'fold' };
  if (score > 2e12) return { action: 'raise', raiseTo: t.currentBet + t.minRaise };
  return { action: 'call' };
}
