import { MatchStatus } from './match-status.type';

export interface Match {
  id: number;
  matchDate: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  refereeId: number;
  refereeName: string;
  tournamentId: number;
  tournamentName: string;
  createdAt: string;
  updatedAt: string | null;
}
