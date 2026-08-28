import type { Player } from '@deckora/shared';
import { BOT_LEVEL_RANGE } from '@deckora/shared';

/**
 * Crea un bot sustituto con nivel similar al jugador desconectado.
 * En el futuro usaremos el MMR real del jugador.
 */
export function createBotPlayer(original: Player, _seatHint: number): Player {
  const level =
    original.botLevel ??
    randomInRange(BOT_LEVEL_RANGE.min, BOT_LEVEL_RANGE.max);

  return {
    id: original.id, // mantenemos el id para reconexión limpia
    username: `${original.username} (bot)`,
    avatarUrl: original.avatarUrl,
    status: 'bot',
    isBot: true,
    botLevel: level,
    seat: original.seat,
    hand: original.hand,
  };
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Placeholder de decisión de bot.
 * Cada módulo de juego implementará su propia IA según botLevel.
 */
export function decideBotAction(
  _botLevel: number,
  _gameState: unknown
): { action: string; data?: unknown } {
  // TODO: IA real por juego
  return { action: 'pass' };
}
