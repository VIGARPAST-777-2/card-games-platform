import type { RankTier } from './types.js';

/** Escalera oficial Deckora Poker */
export const RANK_LADDER: {
  tier: RankTier;
  minMmr: number;
  maxMmr: number;
  nameEs: string;
  nameEn: string;
  nameFr: string;
  /** Multiplicador de XP necesario para subir (más alto = más difícil) */
  xpHardness: number;
}[] = [
  { tier: 'bronze', minMmr: 0, maxMmr: 399, nameEs: 'Novato', nameEn: 'Rookie', nameFr: 'Novice', xpHardness: 1 },
  { tier: 'bronze', minMmr: 400, maxMmr: 599, nameEs: 'Bronce III', nameEn: 'Bronze III', nameFr: 'Bronze III', xpHardness: 1.1 },
  { tier: 'bronze', minMmr: 600, maxMmr: 799, nameEs: 'Bronce II', nameEn: 'Bronze II', nameFr: 'Bronze II', xpHardness: 1.15 },
  { tier: 'bronze', minMmr: 800, maxMmr: 999, nameEs: 'Bronce I', nameEn: 'Bronze I', nameFr: 'Bronze I', xpHardness: 1.2 },
  { tier: 'silver', minMmr: 1000, maxMmr: 1199, nameEs: 'Plata III', nameEn: 'Silver III', nameFr: 'Argent III', xpHardness: 1.35 },
  { tier: 'silver', minMmr: 1200, maxMmr: 1399, nameEs: 'Plata II', nameEn: 'Silver II', nameFr: 'Argent II', xpHardness: 1.45 },
  { tier: 'silver', minMmr: 1400, maxMmr: 1599, nameEs: 'Plata I', nameEn: 'Silver I', nameFr: 'Argent I', xpHardness: 1.55 },
  { tier: 'gold', minMmr: 1600, maxMmr: 1799, nameEs: 'Oro III', nameEn: 'Gold III', nameFr: 'Or III', xpHardness: 1.7 },
  { tier: 'gold', minMmr: 1800, maxMmr: 1999, nameEs: 'Oro II', nameEn: 'Gold II', nameFr: 'Or II', xpHardness: 1.85 },
  { tier: 'gold', minMmr: 2000, maxMmr: 2199, nameEs: 'Oro I', nameEn: 'Gold I', nameFr: 'Or I', xpHardness: 2 },
  { tier: 'platinum', minMmr: 2200, maxMmr: 2399, nameEs: 'Platino III', nameEn: 'Platinum III', nameFr: 'Platine III', xpHardness: 2.2 },
  { tier: 'platinum', minMmr: 2400, maxMmr: 2599, nameEs: 'Platino II', nameEn: 'Platinum II', nameFr: 'Platine II', xpHardness: 2.4 },
  { tier: 'platinum', minMmr: 2600, maxMmr: 2799, nameEs: 'Platino I', nameEn: 'Platinum I', nameFr: 'Platine I', xpHardness: 2.6 },
  { tier: 'diamond', minMmr: 2800, maxMmr: 2999, nameEs: 'Diamante III', nameEn: 'Diamond III', nameFr: 'Diamant III', xpHardness: 2.9 },
  { tier: 'diamond', minMmr: 3000, maxMmr: 3199, nameEs: 'Diamante II', nameEn: 'Diamond II', nameFr: 'Diamant II', xpHardness: 3.2 },
  { tier: 'diamond', minMmr: 3200, maxMmr: 3399, nameEs: 'Diamante I', nameEn: 'Diamond I', nameFr: 'Diamant I', xpHardness: 3.5 },
  { tier: 'master', minMmr: 3400, maxMmr: 3699, nameEs: 'Maestro', nameEn: 'Master', nameFr: 'Maitre', xpHardness: 4 },
  { tier: 'master', minMmr: 3700, maxMmr: 99999, nameEs: 'Gran Maestro', nameEn: 'Grandmaster', nameFr: 'Grand Maitre', xpHardness: 5 },
];

export function rankFromMmr(mmr: number) {
  const row = RANK_LADDER.find((r) => mmr >= r.minMmr && mmr <= r.maxMmr) ?? RANK_LADDER[0];
  return row;
}

export function formatRank(mmr: number, lang: 'es' | 'en' | 'fr' = 'es'): string {
  const r = rankFromMmr(mmr);
  if (lang === 'en') return r.nameEn;
  if (lang === 'fr') return r.nameFr;
  return r.nameEs;
}

/** XP ganado por partida; a más rango, menos XP neto relativo (más hardness en nivel) */
export function xpForMatch(mmr: number, won: boolean): number {
  const { xpHardness } = rankFromMmr(mmr);
  const base = won ? 80 : 25;
  return Math.max(5, Math.round(base / Math.sqrt(xpHardness)));
}

/** MMR delta aproximado */
export function mmrDelta(myMmr: number, oppAvg: number, won: boolean): number {
  const expected = 1 / (1 + Math.pow(10, (oppAvg - myMmr) / 400));
  const score = won ? 1 : 0;
  const k = myMmr >= 3400 ? 16 : myMmr >= 2200 ? 24 : 32;
  return Math.round(k * (score - expected));
}

/** Ventana de matchmaking por cercanía de rango (±MMR) */
export function matchmakingWindow(mmr: number): number {
  if (mmr < 1000) return 300;
  if (mmr < 2000) return 250;
  if (mmr < 3000) return 200;
  return 150;
}
