import { PlayerPosition } from './player-position.type';

const positionCodeMap: Record<number, PlayerPosition> = {
  0: 'Goalkeeper',
  1: 'Defender',
  2: 'Midfielder',
  3: 'Forward',
};

const positionValueMap: Record<PlayerPosition, number> = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Forward: 3,
};

export function toPlayerPosition(value: number | string): PlayerPosition {
  if (typeof value === 'string') {
    if (value in positionValueMap) {
      return value as PlayerPosition;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed in positionCodeMap) {
      return positionCodeMap[parsed];
    }
  }

  if (typeof value === 'number' && value in positionCodeMap) {
    return positionCodeMap[value];
  }

  return 'Goalkeeper';
}

export function toPlayerPositionCode(position: PlayerPosition): number {
  return positionValueMap[position];
}
