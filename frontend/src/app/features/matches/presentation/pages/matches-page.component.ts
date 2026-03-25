import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ToastNotification, ToastType } from '../../../../shared/domain/models/toast-notification.model';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';

import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Referee } from '../../../referees/domain/models/referee.model';
import { RefereeApiService } from '../../../referees/infrastructure/repositories/referee-api.service';
import { Tournament } from '../../../tournaments/domain/models/tournament.model';
import { TournamentApiService } from '../../../tournaments/infrastructure/repositories/tournament-api.service';
import { MatchCreatePayload } from '../../domain/models/match-create.model';
import { Match } from '../../domain/models/match.model';
import { MatchStatus } from '../../domain/models/match-status.type';
import { MatchApiService } from '../../infrastructure/repositories/match-api.service';

@Component({
  selector: 'app-matches-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, ToastStackComponent],
  templateUrl: './matches-page.component.html',
  styleUrl: './matches-page.component.scss',
})
export class MatchesPageComponent {
  private readonly matchApi = inject(MatchApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly refereeApi = inject(RefereeApiService);
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly matches = signal<Match[]>([]);
  protected readonly teams = signal<Team[]>([]);
  protected readonly referees = signal<Referee[]>([]);
  protected readonly tournaments = signal<Tournament[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isCatalogLoading = signal(true);
  protected readonly isTournamentTeamsLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isCreateModalOpen = signal(false);
  protected readonly isScoreModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly selectedMatchForScore = signal<Match | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly filterStatus = signal<MatchStatus | ''>('');
  protected readonly filterTournamentId = signal(0);
  protected readonly searchTerm = signal('');
  protected readonly selectedCreateTournamentId = signal(0);
  protected readonly selectedHomeTeamId = signal(0);
  protected readonly selectedAwayTeamId = signal(0);
  protected readonly statusOptions: MatchStatus[] = [
    'Scheduled',
    'InProgress',
    'Finished',
    'Suspended',
  ];
  protected readonly tournamentTeams = signal<Team[]>([]);
  protected readonly filteredMatches = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.matches();
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
  protected readonly inProgressCount = computed(
    () => this.filteredMatches().filter((match) => match.status === 'InProgress').length,
  );
  protected readonly scheduledCount = computed(
    () => this.filteredMatches().filter((match) => match.status === 'Scheduled').length,
  );
  protected readonly selectedTournament = computed(
    () => this.tournaments().find((tournament) => tournament.id === this.selectedCreateTournamentId()) ?? null,
  );
  protected readonly availableHomeTeams = computed(() => {
    const awayTeamId = this.selectedAwayTeamId();

    return this.tournamentTeams().filter((team) => team.id !== awayTeamId);
  });
  protected readonly availableAwayTeams = computed(() => {
    const homeTeamId = this.selectedHomeTeamId();

    return this.tournamentTeams().filter((team) => team.id !== homeTeamId);
  });
  protected readonly canCreateMatch = computed(
    () => this.tournamentTeams().length >= 2 && !this.isTournamentTeamsLoading(),
  );
  protected readonly createForm = this.formBuilder.nonNullable.group({
    matchDate: ['', [Validators.required]],
    tournamentId: [0, [Validators.required, Validators.min(1)]],
    homeTeamId: [0, [Validators.required, Validators.min(1)]],
    awayTeamId: [0, [Validators.required, Validators.min(1)]],
    refereeId: [0, [Validators.required, Validators.min(1)]],
  });
  protected readonly scoreForm = this.formBuilder.nonNullable.group({
    homeScore: [0, [Validators.required, Validators.min(0)]],
    awayScore: [0, [Validators.required, Validators.min(0)]],
    isFinalScore: [false],
  });

  constructor() {
    this.loadMatches();
    this.loadCatalogs();
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

  protected trackByMatchId(_: number, match: Match): number {
    return match.id;
  }

  protected retry(): void {
    this.loadMatches();
    this.loadCatalogs();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected updateFilterStatus(value: MatchStatus | ''): void {
    this.filterStatus.set(value);
    this.loadMatches();
  }

  protected updateFilterTournament(value: number): void {
    this.filterTournamentId.set(value);
    this.loadMatches();
  }

  protected openCreateModal(): void {
    this.createForm.reset({
      matchDate: '',
      tournamentId: 0,
      homeTeamId: 0,
      awayTeamId: 0,
      refereeId: 0,
    });
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();
    this.tournamentTeams.set([]);
    this.isTournamentTeamsLoading.set(false);
    this.selectedCreateTournamentId.set(0);
    this.selectedHomeTeamId.set(0);
    this.selectedAwayTeamId.set(0);
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    if (!this.isSaving()) {
      this.isCreateModalOpen.set(false);
      this.tournamentTeams.set([]);
      this.isTournamentTeamsLoading.set(false);
      this.selectedCreateTournamentId.set(0);
      this.selectedHomeTeamId.set(0);
      this.selectedAwayTeamId.set(0);
    }
  }

  protected openScoreModal(match: Match): void {
    this.selectedMatchForScore.set(match);
    this.scoreForm.reset({
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isFinalScore: match.status === 'Finished',
    });
    this.isScoreModalOpen.set(true);
  }

  protected closeScoreModal(): void {
    if (!this.isSaving()) {
      this.isScoreModalOpen.set(false);
      this.selectedMatchForScore.set(null);
    }
  }

  protected submitCreateForm(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload = this.createForm.getRawValue() as MatchCreatePayload;
    if (payload.homeTeamId === payload.awayTeamId) {
      this.pushNotification('error', 'Equipos invalidos', 'El equipo local y visitante deben ser diferentes.');
      return;
    }

    this.isSaving.set(true);
    this.matchApi.create(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isCreateModalOpen.set(false);
        this.pushNotification('success', 'Partido creado', 'El partido fue programado correctamente.');
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo crear el partido', parseApiErrorMessage(error));
      },
    });
  }

  protected submitScoreForm(): void {
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
        this.pushNotification('success', 'Marcador actualizado', 'El marcador del partido se guardo correctamente.');
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo actualizar el marcador', parseApiErrorMessage(error));
      },
    });
  }

  protected updateMatchStatus(match: Match, status: MatchStatus): void {
    this.isSaving.set(true);
    this.matchApi.updateStatus(match.id, status).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.pushNotification('success', 'Estado actualizado', `El partido paso a ${this.getStatusLabel(status)}.`);
        this.loadMatches();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo actualizar el estado', parseApiErrorMessage(error));
      },
    });
  }

  protected dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  protected getStatusLabel(status: MatchStatus): string {
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

  protected getStatusActionLabel(currentStatus: MatchStatus, nextStatus: MatchStatus): string {
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

  protected getNextStatusOptions(match: Match): MatchStatus[] {
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

  protected canEditScore(match: Match): boolean {
    return match.status !== 'Scheduled' && match.status !== 'Suspended';
  }

  protected canMarkAsFinal(match: Match): boolean {
    return match.status === 'Finished';
  }

  protected hasCreateFieldError(fieldName: keyof typeof this.createForm.controls): boolean {
    const control = this.createForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected getCreateFieldError(fieldName: keyof typeof this.createForm.controls): string {
    const control = this.createForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'Selecciona una opcion valida.';
    }

    return 'Revisa este campo.';
  }

  protected hasScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): boolean {
    const control = this.scoreForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected getScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): string {
    const control = this.scoreForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'El marcador no puede ser negativo.';
    }

    return 'Revisa este campo.';
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
      if (pending === 0) this.isCatalogLoading.set(false);
    };

    this.teamApi.getAll().subscribe({ next: (teams) => { this.teams.set(teams); done(); }, error: () => done() });
    this.refereeApi.getAll().subscribe({ next: (referees) => { this.referees.set(referees); done(); }, error: () => done() });
    this.tournamentApi.getAll().subscribe({ next: (tournaments) => { this.tournaments.set(tournaments); done(); }, error: () => done() });
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
    pushToastNotification(this.notifications, (notificationId) => this.dismissNotification(notificationId), type, title, message);
  }
}
