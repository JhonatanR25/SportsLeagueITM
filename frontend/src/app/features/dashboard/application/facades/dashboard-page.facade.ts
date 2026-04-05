import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { appSettings } from '../../../../core/config/app-settings';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { Match } from '../../../matches/domain/models/match.model';
import { MatchApiService } from '../../../matches/infrastructure/repositories/match-api.service';
import { Player } from '../../../players/domain/models/player.model';
import { PlayerApiService } from '../../../players/infrastructure/repositories/player-api.service';
import { Referee } from '../../../referees/domain/models/referee.model';
import { RefereeApiService } from '../../../referees/infrastructure/repositories/referee-api.service';
import { Sponsor } from '../../../sponsors/domain/models/sponsor.model';
import { SponsorApiService } from '../../../sponsors/infrastructure/repositories/sponsor-api.service';
import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Tournament } from '../../../tournaments/domain/models/tournament.model';
import { TournamentApiService } from '../../../tournaments/infrastructure/repositories/tournament-api.service';

type ModuleCard = {
  title: string;
  route: string;
  accent: 'gold' | 'blue' | 'green' | 'red' | 'cyan';
  tone: 'hero' | 'priority' | 'support';
  summary: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
  cta: string;
};

type ExecutiveStat = {
  label: string;
  value: string;
  copy: string;
};

@Injectable()
export class DashboardPageFacade {
  private readonly teamApi = inject(TeamApiService);
  private readonly playerApi = inject(PlayerApiService);
  private readonly refereeApi = inject(RefereeApiService);
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly matchApi = inject(MatchApiService);
  private readonly sponsorApi = inject(SponsorApiService);

  readonly currentSeason = appSettings.currentSeason;
  readonly teams = signal<Team[]>([]);
  readonly players = signal<Player[]>([]);
  readonly referees = signal<Referee[]>([]);
  readonly tournaments = signal<Tournament[]>([]);
  readonly matches = signal<Match[]>([]);
  readonly sponsors = signal<Sponsor[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly modules = computed<ModuleCard[]>(() => {
    const teams = this.teams();
    const players = this.players();
    const referees = this.referees();
    const tournaments = this.tournaments();
    const matches = this.matches();
    const sponsors = this.sponsors();

    const uniqueCities = new Set(teams.map((team) => team.city.trim().toLowerCase())).size;
    const nationalityCounts = Object.entries(
      referees.reduce<Record<string, number>>((accumulator, referee) => {
        accumulator[referee.nationality] = (accumulator[referee.nationality] ?? 0) + 1;
        return accumulator;
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3);

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
        tone: 'support',
        summary: 'Cobertura territorial, clubes activos y estructura base de la competencia.',
        stats: [
          { label: 'Equipos', value: String(teams.length) },
          { label: 'Ciudades', value: String(uniqueCities) },
        ],
        cta: 'Ver equipos',
      },
      {
        title: 'Jugadores',
        route: '/players',
        accent: 'green',
        tone: 'support',
        summary: 'Volumen de plantillas y distribucion por posicion deportiva.',
        stats: [
          { label: 'Arqueros', value: String(playerPositionCounts.goalkeepers) },
          { label: 'Defensas', value: String(playerPositionCounts.defenders) },
          { label: 'Mediocampo', value: String(playerPositionCounts.midfielders) },
          { label: 'Delanteros', value: String(playerPositionCounts.forwards) },
        ],
        cta: 'Ver jugadores',
      },
      {
        title: 'Arbitros',
        route: '/referees',
        accent: 'red',
        tone: 'support',
        summary: 'Disponibilidad arbitral y cobertura por nacionalidad.',
        stats: [
          { label: 'Disponibles', value: String(referees.length) },
          ...nationalityCounts.map(([nationality, count]) => ({
            label: nationality,
            value: String(count),
          })),
        ],
        cta: 'Ver arbitros',
      },
      {
        title: 'Torneos',
        route: '/tournaments',
        accent: 'gold',
        tone: 'hero',
        summary: 'Nucleo estrategico de la operacion competitiva y control de temporada.',
        stats: [
          { label: 'Torneos', value: String(tournaments.length) },
          {
            label: 'En curso',
            value: String(
              tournaments.filter((tournament) => tournament.status === 'InProgress').length,
            ),
          },
          {
            label: 'Pendientes',
            value: String(
              tournaments.filter((tournament) => tournament.status === 'Pending').length,
            ),
          },
          {
            label: 'Finalizados',
            value: String(
              tournaments.filter((tournament) => tournament.status === 'Finished').length,
            ),
          },
        ],
        cta: 'Ver torneos',
      },
      {
        title: 'Sponsor',
        route: '/sponsors',
        accent: 'gold',
        tone: 'priority',
        summary: 'Relacion comercial activa, categorias de valor y presencia digital.',
        stats: [
          { label: 'Activos', value: String(sponsors.length) },
          {
            label: 'Principales',
            value: String(sponsors.filter((sponsor) => sponsor.category === 'Main').length),
          },
          {
            label: 'Gold',
            value: String(sponsors.filter((sponsor) => sponsor.category === 'Gold').length),
          },
          {
            label: 'Con sitio web',
            value: String(sponsors.filter((sponsor) => !!sponsor.websiteUrl?.trim()).length),
          },
        ],
        cta: 'Ver sponsor',
      },
      {
        title: 'Partidos',
        route: '/matches',
        accent: 'cyan',
        tone: 'priority',
        summary: 'Ritmo operativo del calendario y estado actual de la jornada.',
        stats: [
          {
            label: 'Programados',
            value: String(matches.filter((match) => match.status === 'Scheduled').length),
          },
          {
            label: 'En juego',
            value: String(matches.filter((match) => match.status === 'InProgress').length),
          },
          {
            label: 'Suspendidos',
            value: String(matches.filter((match) => match.status === 'Suspended').length),
          },
          {
            label: 'Finalizados',
            value: String(matches.filter((match) => match.status === 'Finished').length),
          },
        ],
        cta: 'Ver partidos',
      },
    ];
  });
  readonly executiveStats = computed<ExecutiveStat[]>(() => {
    const tournaments = this.tournaments();
    const matches = this.matches();
    const sponsors = this.sponsors();

    return [
      {
        label: 'Frentes activos',
        value: String(
          tournaments.filter((tournament) => tournament.status === 'InProgress').length +
            matches.filter((match) => match.status === 'InProgress').length,
        ),
        copy: 'Torneos y partidos en ejecucion simultanea.',
      },
      {
        label: 'Calendario resuelto',
        value: String(matches.filter((match) => match.status === 'Finished').length),
        copy: 'Partidos cerrados con marcador final registrado.',
      },
      {
        label: 'Valor comercial',
        value: String(sponsors.filter((sponsor) => sponsor.category === 'Main').length),
        copy: 'Sponsors principales sosteniendo la temporada.',
      },
    ];
  });
  readonly primaryModule = computed<ModuleCard | null>(
    () => this.modules().find((module) => module.tone === 'hero') ?? null,
  );
  readonly featuredModules = computed<ModuleCard[]>(
    () => this.modules().filter((module) => module.tone === 'priority'),
  );
  readonly operationalModules = computed<ModuleCard[]>(
    () => this.modules().filter((module) => module.tone === 'support'),
  );

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      teams: this.teamApi.getAll(),
      players: this.playerApi.getAll(),
      referees: this.refereeApi.getAll(),
      tournaments: this.tournamentApi.getAll(),
      matches: this.matchApi.getAll(),
      sponsors: this.sponsorApi.getAll(),
    }).subscribe({
      next: ({ teams, players, referees, tournaments, matches, sponsors }) => {
        this.teams.set(teams);
        this.players.set(players);
        this.referees.set(referees);
        this.tournaments.set(tournaments);
        this.matches.set(matches);
        this.sponsors.set(sponsors);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(parseApiErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    this.loadDashboard();
  }
}
