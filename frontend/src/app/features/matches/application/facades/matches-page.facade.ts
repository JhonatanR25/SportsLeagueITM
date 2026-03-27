import { computed, inject, Injectable, signal } from '@angular/core';
import { startWith } from 'rxjs';

import {
  ToastNotification,
  ToastType,
} from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Referee } from '../../../referees/domain/models/referee.model';
import { RefereeApiService } from '../../../referees/infrastructure/repositories/referee-api.service';
import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Tournament } from '../../../tournaments/domain/models/tournament.model';
import { TournamentApiService } from '../../../tournaments/infrastructure/repositories/tournament-api.service';
import { Match } from '../../domain/models/match.model';
import { MatchStatus } from '../../domain/models/match-status.type';
import { MatchApiService } from '../../infrastructure/repositories/match-api.service';
import { MatchesFormService } from './matches-form.service';

@Injectable()
export class MatchesPageFacade {
  private readonly matchApi = inject(MatchApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly refereeApi = inject(RefereeApiService);
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly formService = inject(MatchesFormService);

  readonly matches = signal<Match[]>([]);
  readonly teams = signal<Team[]>([]);
  readonly referees = signal<Referee[]>([]);
  readonly tournaments = signal<Tournament[]>([]);
  readonly isLoading = signal(true);
  readonly isCatalogLoading = signal(true);
  readonly isTournamentTeamsLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isCreateModalOpen = signal(false);
  readonly isScoreModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly selectedMatchForScore = signal<Match | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly filterStatus = signal<MatchStatus | ''>('');
  readonly filterTournamentId = signal(0);
  readonly searchTerm = signal('');
  readonly selectedCreateTournamentId = signal(0);
  readonly selectedHomeTeamId = signal(0);
  readonly selectedAwayTeamId = signal(0);
  readonly statusOptions: MatchStatus[] = ['Scheduled', 'InProgress', 'Finished', 'Suspended'];
  readonly tournamentTeams = signal<Team[]>([]);
  readonly createForm = this.formService.createForm;
  readonly scoreForm = this.formService.scoreForm;
  readonly filteredMatches = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.matches();
    }

    return this.matches().filter((match) =>
      [
        match.homeTeamName,
        match.awayTeamName,
        match.refereeName,
        match.tournamentName,
        match.status,
      ].some((value) => value.toLowerCase().includes(term)),
    );
  });
  readonly inProgressCount = computed(
    () => this.filteredMatches().filter((match) => match.status === 'InProgress').length,
  );
  readonly scheduledCount = computed(
    () => this.filteredMatches().filter((match) => match.status === 'Scheduled').length,
  );
  readonly selectedTournament = computed(
    () =>
      this.tournaments().find(
        (tournament) => tournament.id === this.selectedCreateTournamentId(),
      ) ?? null,
  );
  readonly availableHomeTeams = computed(() => {
    const awayTeamId = this.selectedAwayTeamId();
    return this.tournamentTeams().filter((team) => team.id !== awayTeamId);
  });
  readonly availableAwayTeams = computed(() => {
    const homeTeamId = this.selectedHomeTeamId();
    return this.tournamentTeams().filter((team) => team.id !== homeTeamId);
  });
  readonly canCreateMatch = computed(
    () => this.tournamentTeams().length >= 2 && !this.isTournamentTeamsLoading(),
  );

  constructor() {
    this.createForm.controls.tournamentId.valueChanges
      .pipe(startWith(this.createForm.controls.tournamentId.value))
      .subscribe((tournamentId) => {
        this.selectedCreateTournamentId.set(tournamentId);
        this.handleTournamentSelection(tournamentId);
      });

    this.createForm.controls.homeTeamId.valueChanges
      .pipe(startWith(this.createForm.controls.homeTeamId.value))
      .subscribe((teamId) => {
        this.selectedHomeTeamId.set(teamId);
      });

    this.createForm.controls.awayTeamId.valueChanges
      .pipe(startWith(this.createForm.controls.awayTeamId.value))
      .subscribe((teamId) => {
        this.selectedAwayTeamId.set(teamId);
      });
  }

  loadInitialData(): void {
    this.loadMatches();
    this.loadCatalogs();
  }

  retry(): void {
    this.loadMatches();
    this.loadCatalogs();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateFilterStatus(value: MatchStatus | ''): void {
    this.filterStatus.set(value);
    this.loadMatches();
  }

  updateFilterTournament(value: number): void {
    this.filterTournamentId.set(value);
    this.loadMatches();
  }

  openCreateModal(): void {
    this.formService.resetCreateForm();
    this.tournamentTeams.set([]);
    this.isTournamentTeamsLoading.set(false);
    this.selectedCreateTournamentId.set(0);
    this.selectedHomeTeamId.set(0);
    this.selectedAwayTeamId.set(0);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (!this.isSaving()) {
      this.isCreateModalOpen.set(false);
      this.tournamentTeams.set([]);
      this.isTournamentTeamsLoading.set(false);
      this.selectedCreateTournamentId.set(0);
      this.selectedHomeTeamId.set(0);
      this.selectedAwayTeamId.set(0);
    }
  }

  openScoreModal(match: Match): void {
    this.selectedMatchForScore.set(match);
    this.formService.resetScoreForm(match);
    this.isScoreModalOpen.set(true);
  }

  closeScoreModal(): void {
    if (!this.isSaving()) {
      this.isScoreModalOpen.set(false);
      this.selectedMatchForScore.set(null);
    }
  }

  submitCreateForm(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload = this.formService.buildCreatePayload();

    if (payload.homeTeamId === payload.awayTeamId) {
      this.pushNotification(
        'error',
        'Equipos invalidos',
        'El equipo local y visitante deben ser diferentes.',
      );
      return;
    }

    this.isSaving.set(true);
    this.matchApi.create(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isCreateModalOpen.set(false);
        this.pushNotification(
          'success',
          'Partido creado',
          'El partido fue programado correctamente.',
        );
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo crear el partido', parseApiErrorMessage(error));
      },
    });
  }

  submitScoreForm(): void {
    const match = this.selectedMatchForScore();

    if (!match || this.scoreForm.invalid) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    const { homeScore, awayScore, isFinalScore } = this.scoreForm.getRawValue();
    this.isSaving.set(true);
    this.matchApi.updateScore(match.id, homeScore, awayScore, isFinalScore).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isScoreModalOpen.set(false);
        this.selectedMatchForScore.set(null);
        this.pushNotification(
          'success',
          'Marcador actualizado',
          'El marcador del partido se guardo correctamente.',
        );
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          'No se pudo actualizar el marcador',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  updateMatchStatus(match: Match, status: MatchStatus): void {
    this.isSaving.set(true);
    this.matchApi.updateStatus(match.id, status).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.pushNotification(
          'success',
          'Estado actualizado',
          `El partido paso a ${this.getStatusLabel(status)}.`,
        );
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          'No se pudo actualizar el estado',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  getStatusLabel(status: MatchStatus): string {
    switch (status) {
      case 'Scheduled':
        return 'Programado';
      case 'InProgress':
        return 'En juego';
      case 'Finished':
        return 'Finalizado';
      case 'Suspended':
        return 'Suspendido';
    }
  }

  getStatusActionLabel(currentStatus: MatchStatus, nextStatus: MatchStatus): string {
    switch (nextStatus) {
      case 'InProgress':
        return currentStatus === 'Suspended' ? 'Reanudar partido' : 'Iniciar partido';
      case 'Finished':
        return 'Finalizar partido';
      case 'Suspended':
        return 'Suspender partido';
      case 'Scheduled':
        return 'Programar';
    }
  }

  getNextStatusOptions(match: Match): MatchStatus[] {
    switch (match.status) {
      case 'Scheduled':
        return ['InProgress', 'Suspended'];
      case 'InProgress':
        return ['Finished', 'Suspended'];
      case 'Suspended':
        return ['InProgress', 'Finished'];
      case 'Finished':
        return [];
    }
  }

  canEditScore(match: Match): boolean {
    return match.status !== 'Scheduled' && match.status !== 'Suspended';
  }

  canMarkAsFinal(match: Match): boolean {
    return match.status === 'Finished';
  }

  hasCreateFieldError(fieldName: keyof typeof this.createForm.controls): boolean {
    return this.formService.hasCreateFieldError(fieldName);
  }

  getCreateFieldError(fieldName: keyof typeof this.createForm.controls): string {
    return this.formService.getCreateFieldError(fieldName);
  }

  hasScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): boolean {
    return this.formService.hasScoreFieldError(fieldName);
  }

  getScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): string {
    return this.formService.getScoreFieldError(fieldName);
  }

  private loadMatches(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.matchApi
      .getAll({
        tournamentId: this.filterTournamentId() || undefined,
        status: this.filterStatus() || undefined,
      })
      .subscribe({
        next: (matches) => {
          this.matches.set(matches);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(parseApiErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  private loadCatalogs(): void {
    this.isCatalogLoading.set(true);
    let pending = 3;

    const done = () => {
      pending -= 1;

      if (pending === 0) {
        this.isCatalogLoading.set(false);
      }
    };

    this.teamApi.getAll().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        done();
      },
      error: () => done(),
    });

    this.refereeApi.getAll().subscribe({
      next: (referees) => {
        this.referees.set(referees);
        done();
      },
      error: () => done(),
    });

    this.tournamentApi.getAll().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        done();
      },
      error: () => done(),
    });
  }

  private handleTournamentSelection(tournamentId: number): void {
    this.createForm.patchValue(
      {
        homeTeamId: 0,
        awayTeamId: 0,
      },
      { emitEvent: false },
    );
    this.selectedHomeTeamId.set(0);
    this.selectedAwayTeamId.set(0);

    if (tournamentId <= 0) {
      this.tournamentTeams.set([]);
      this.isTournamentTeamsLoading.set(false);
      return;
    }

    this.isTournamentTeamsLoading.set(true);
    this.tournamentApi.getTeams(tournamentId).subscribe({
      next: (teams) => {
        this.tournamentTeams.set(teams);
        this.isTournamentTeamsLoading.set(false);
      },
      error: () => {
        this.tournamentTeams.set([]);
        this.isTournamentTeamsLoading.set(false);
      },
    });
  }

  private pushNotification(type: ToastType, title: string, message: string): void {
    pushToastNotification(
      this.notifications,
      (notificationId) => this.dismissNotification(notificationId),
      type,
      title,
      message,
    );
  }
}
