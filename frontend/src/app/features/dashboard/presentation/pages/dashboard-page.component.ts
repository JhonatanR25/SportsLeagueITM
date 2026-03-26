import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Match } from '../../../matches/domain/models/match.model';
import { MatchApiService } from '../../../matches/infrastructure/repositories/match-api.service';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { Player } from '../../../players/domain/models/player.model';
import { PlayerApiService } from '../../../players/infrastructure/repositories/player-api.service';
import { Referee } from '../../../referees/domain/models/referee.model';
import { RefereeApiService } from '../../../referees/infrastructure/repositories/referee-api.service';
import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Tournament } from '../../../tournaments/domain/models/tournament.model';
import { TournamentApiService } from '../../../tournaments/infrastructure/repositories/tournament-api.service';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';

type ModuleCard = {
  title: string;
  route: string;
  accent: 'gold' | 'blue' | 'green' | 'red' | 'cyan';
  stats: Array<{
    label: string;
    value: string;
  }>;
  totalLabel: string;
  cta: string;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StateCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly teamApi = inject(TeamApiService);
  private readonly playerApi = inject(PlayerApiService);
  private readonly refereeApi = inject(RefereeApiService);
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly matchApi = inject(MatchApiService);

  protected readonly teams = signal<Team[]>([]);
  protected readonly players = signal<Player[]>([]);
  protected readonly referees = signal<Referee[]>([]);
  protected readonly tournaments = signal<Tournament[]>([]);
  protected readonly matches = signal<Match[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly modules = computed<ModuleCard[]>(() => {
    const teams = this.teams();
    const players = this.players();
    const referees = this.referees();
    const tournaments = this.tournaments();
    const matches = this.matches();

    const uniqueCities = new Set(teams.map((team) => team.city.trim().toLowerCase())).size;
    const nationalityCounts = Object.entries(
      referees.reduce<Record<string, number>>((accumulator, referee) => {
        accumulator[referee.nationality] = (accumulator[referee.nationality] ?? 0) + 1;
        return accumulator;
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4);

    const playerPositionCounts = {
      goalkeepers: players.filter((player) => player.position === 'Goalkeeper').length,
      defenders: players.filter((player) => player.position === 'Defender').length,
      midfielders: players.filter((player) => player.position === 'Midfielder').length,
      forwards: players.filter((player) => player.position === 'Forward').length,
    };

    return [
      {
        title: 'Equipos',
        route: '/teams',
        accent: 'blue',
        stats: [
          { label: 'Equipos registrados', value: String(teams.length) },
          { label: 'Ciudades cubiertas', value: String(uniqueCities) },
          { label: 'Ciudades disponibles', value: String(Math.max(0, teams.length - uniqueCities)) },
        ],
        totalLabel: `Total: ${teams.length} equipos`,
        cta: 'Ver equipos',
      },
      {
        title: 'Jugadores',
        route: '/players',
        accent: 'green',
        stats: [
          { label: 'Arqueros', value: String(playerPositionCounts.goalkeepers) },
          { label: 'Defensas', value: String(playerPositionCounts.defenders) },
          { label: 'Mediocampo', value: String(playerPositionCounts.midfielders) },
          { label: 'Delanteros', value: String(playerPositionCounts.forwards) },
        ],
        totalLabel: `Total: ${players.length} jugadores`,
        cta: 'Ver jugadores',
      },
      {
        title: 'Arbitros',
        route: '/referees',
        accent: 'red',
        stats: [
          { label: 'Arbitros disponibles', value: String(referees.length) },
          ...nationalityCounts.map(([nationality, count]) => ({
            label: nationality,
            value: String(count),
          })),
        ],
        totalLabel: `Total: ${referees.length} arbitros`,
        cta: 'Ver arbitros',
      },
      {
        title: 'Torneos',
        route: '/tournaments',
        accent: 'gold',
        stats: [
          { label: 'Torneos totales', value: String(tournaments.length) },
          { label: 'En curso', value: String(tournaments.filter((tournament) => tournament.status === 'InProgress').length) },
          { label: 'Pendientes', value: String(tournaments.filter((tournament) => tournament.status === 'Pending').length) },
          { label: 'Finalizados', value: String(tournaments.filter((tournament) => tournament.status === 'Finished').length) },
        ],
        totalLabel: `Total: ${tournaments.length} torneos`,
        cta: 'Ver torneos',
      },
      {
        title: 'Partidos',
        route: '/matches',
        accent: 'cyan',
        stats: [
          { label: 'Programados', value: String(matches.filter((match) => match.status === 'Scheduled').length) },
          { label: 'En juego', value: String(matches.filter((match) => match.status === 'InProgress').length) },
          { label: 'Suspendidos', value: String(matches.filter((match) => match.status === 'Suspended').length) },
          { label: 'Finalizados', value: String(matches.filter((match) => match.status === 'Finished').length) },
        ],
        totalLabel: `Total: ${matches.length} partidos`,
        cta: 'Ver partidos',
      },
    ];
  });

  constructor() {
    this.loadDashboard();
  }

  protected retry(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      teams: this.teamApi.getAll(),
      players: this.playerApi.getAll(),
      referees: this.refereeApi.getAll(),
      tournaments: this.tournamentApi.getAll(),
      matches: this.matchApi.getAll(),
    }).subscribe({
      next: ({ teams, players, referees, tournaments, matches }) => {
        this.teams.set(teams);
        this.players.set(players);
        this.referees.set(referees);
        this.tournaments.set(tournaments);
        this.matches.set(matches);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(parseApiErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }
}
