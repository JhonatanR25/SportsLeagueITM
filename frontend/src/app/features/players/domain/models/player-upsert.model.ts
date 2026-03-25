import { PlayerPosition } from './player-position.type';

export interface PlayerUpsertPayload {
  firstName: string;
  lastName: string;
  birthDate: string;
  number: number;
  position: PlayerPosition;
  teamId: number;
}
