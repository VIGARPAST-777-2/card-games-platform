import type { RankTier } from './types.js';
import { RANK_TIERS } from './constants.js';

export function mmrToTier(mmr: number): { tier: RankTier; division: number } {
  if (mmr < 400) return { tier: 'bronze', division: clampDivision(mmr, 0, 400) };
  if (mmr < 800) return { tier: 'silver', division: clampDivision(mmr, 400, 800) };
  if (mmr < 1200) return { tier: 'gold', division: clampDivision(mmr, 800, 1200) };
  if (mmr < 1600) return { tier: 'platinum', division: clampDivision(mmr, 1200, 1600) };
  if (mmr < 2000) return { tier: 'diamond', division: clampDivision(mmr, 1600, 2000) };
  return { tier: 'master', division: 1 };
}

function clampDivision(mmr: number, min: number, max: number): number {
  const range = max - min;
  const pos = (mmr - min) / range;
  if (pos < 0.33) return 3;
  if (pos < 0.66) return 2;
  return 1;
}

export function formatRank(tier: RankTier, division: number): string {
  const names: Record<RankTier, string> = {
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    platinum: 'Platino',
    diamond: 'Diamante',
    master: 'Maestro',
  };
  if (tier === 'master') return names[tier];
  const roman = ['', 'I', 'II', 'III'][division] ?? '';
  return `${names[tier]} ${roman}`;
}

export function nextTier(tier: RankTier): RankTier | null {
  const idx = RANK_TIERS.indexOf(tier);
  if (idx === -1 || idx === RANK_TIERS.length - 1) return null;
  return RANK_TIERS[idx + 1];
}
