import { TournamentStatus } from './tournament-status.type';

export interface Tournament {
  id: number;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  teamsCount: number;
  createdAt: string;
}
