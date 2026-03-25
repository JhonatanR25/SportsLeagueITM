import { PlayerPosition } from './player-position.type';

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  number: number;
  position: PlayerPosition;
  teamId: number;
  teamName: string;
  createdAt: string;
}
