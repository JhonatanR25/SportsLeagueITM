export interface TournamentSponsor {
  id: number;
  tournamentId: number;
  tournamentName: string;
  sponsorId: number;
  sponsorName: string;
  contractAmount: number;
  joinedAt: string;
}
