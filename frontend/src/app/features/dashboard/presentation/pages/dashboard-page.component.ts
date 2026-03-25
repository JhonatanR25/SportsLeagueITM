import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Match } from '../../../matches/domain/models/match.model';
import { MatchApiService } from '../../../matches/infrastructure/repositories/match-api.service';
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
  countLabel: string;
  countValue: string;
  detailLabel: string;
  detailValue: string;
  helper: string;
  cta: string;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

    const largestSquad =
      Object.entries(
        players.reduce<Record<string, number>>((accumulator, player) => {
          accumulator[player.teamName] = (accumulator[player.teamName] ?? 0) + 1;
          return accumulator;
        }, {}),
      ).sort((left, right) => right[1] - left[1])[0] ?? null;

    const mainNationality =
      Object.entries(
        referees.reduce<Record<string, number>>((accumulator, referee) => {
          accumulator[referee.nationality] = (accumulator[referee.nationality] ?? 0) + 1;
          return accumulator;
        }, {}),
      ).sort((left, right) => right[1] - left[1])[0] ?? null;

    return [
      {
        title: 'Equipos',
        route: '/teams',
        accent: 'blue',
        countLabel: 'Clubes visibles',
        countValue: String(teams.length),
        detailLabel: 'Estadio principal',
        detailValue: teams[0]?.stadium ?? 'Sin equipos registrados',
        helper: `${new Set(teams.map((team) => team.city.trim().toLowerCase())).size} ciudades y estructura deportiva disponible`,
        cta: 'Ver equipos',
      },
      {
        title: 'Jugadores',
        route: '/players',
        accent: 'green',
        countLabel: 'Jugadores registrados',
        countValue: String(players.length),
        detailLabel: 'Plantilla destacada',
        detailValue: largestSquad ? `${largestSquad[0]} · ${largestSquad[1]}` : 'Sin jugadores registrados',
        helper: `${players.filter((player) => player.position === 'Forward').length} delanteros y ${players.filter((player) => player.position === 'Goalkeeper').length} porteros`,
        cta: 'Ver jugadores',
      },
      {
        title: 'Arbitros',
        route: '/referees',
        accent: 'red',
        countLabel: 'Arbitros disponibles',
        countValue: String(referees.length),
        detailLabel: 'Nacionalidad mas frecuente',
        detailValue: mainNationality ? `${mainNationality[0]} · ${mainNationality[1]}` : 'Sin arbitros registrados',
        helper: `${new Set(referees.map((referee) => referee.nationality.trim().toLowerCase())).size} nacionalidades en el panel arbitral`,
        cta: 'Ver arbitros',
      },
      {
        title: 'Torneos',
        route: '/tournaments',
        accent: 'gold',
        countLabel: 'Torneos visibles',
        countValue: String(tournaments.length),
        detailLabel: 'Pendientes por iniciar',
        detailValue: String(tournaments.filter((tournament) => tournament.status === 'Pending').length),
        helper: `${tournaments.filter((tournament) => tournament.status === 'InProgress').length} en curso y ${tournaments.reduce((sum, tournament) => sum + tournament.teamsCount, 0)} cupos inscritos`,
        cta: 'Ver torneos',
      },
      {
        title: 'Partidos',
        route: '/matches',
        accent: 'cyan',
        countLabel: 'Partidos programados',
        countValue: String(matches.length),
        detailLabel: 'Estado dominante',
        detailValue:
          matches.length > 0
            ? `${matches.filter((match) => match.status === 'Scheduled').length} programados`
            : 'Sin partidos registrados',
        helper: `${matches.filter((match) => match.status === 'Finished').length} finalizados y ${matches.filter((match) => match.status === 'Suspended').length} suspendidos`,
        cta: 'Ver partidos',
      },
    ];
  });

  protected readonly heroStatus = computed(() => {
    const activeTournaments = this.tournaments().filter((tournament) => tournament.status === 'InProgress').length;
    const liveMatches = this.matches().filter((match) => match.status === 'InProgress').length;

    if (activeTournaments > 0 && liveMatches > 0) {
      return 'La liga tiene competiciones activas y seguimiento disponible desde el panel.';
    }

    if (activeTournaments > 0) {
      return 'Hay competiciones en curso y la operacion general se encuentra disponible.';
    }

    return 'La plataforma esta lista para administrar clubes, plantillas, arbitros y calendarios.';
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
