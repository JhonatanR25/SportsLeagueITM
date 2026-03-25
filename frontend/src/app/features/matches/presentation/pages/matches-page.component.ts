import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';

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

type ToastType = 'success' | 'error';
type ToastNotification = { id: number; type: ToastType; title: string; message: string };

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
  protected readonly errorMessage = signal('');
  protected readonly isCreateModalOpen = signal(false);
  protected readonly isScoreModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly selectedMatchForScore = signal<Match | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly filterStatus = signal<MatchStatus | ''>('');
  protected readonly filterTournamentId = signal(0);
  protected readonly searchTerm = signal('');
  protected readonly statusOptions: MatchStatus[] = [
    'Scheduled',
    'InProgress',
    'Finished',
    'Suspended',
  ];
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
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    if (!this.isSaving()) this.isCreateModalOpen.set(false);
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
        this.pushNotification('error', 'No se pudo crear el partido', this.getErrorMessage(error));
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
        this.pushNotification('error', 'No se pudo actualizar el marcador', this.getErrorMessage(error));
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
        this.pushNotification('error', 'No se pudo actualizar el estado', this.getErrorMessage(error));
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
          this.errorMessage.set(this.getErrorMessage(error));
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

  private pushNotification(type: ToastType, title: string, message: string): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.notifications.update((items) => [...items, { id, type, title, message }]);
    window.setTimeout(() => this.dismissNotification(id), 4500);
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrio un error inesperado. Intenta nuevamente.';
    }

    const payload = error.error as
      | { message?: string; detail?: string; errors?: Record<string, string[]> }
      | string
      | null;

    if (typeof payload === 'string' && payload.trim()) return payload;
    if (payload && typeof payload === 'object' && 'message' in payload && payload.message) {
      return String(payload.message);
    }
    if (payload && typeof payload === 'object' && 'detail' in payload && payload.detail) {
      return String(payload.detail);
    }

    const validationErrors =
      payload && typeof payload === 'object' && 'errors' in payload && payload.errors
        ? Object.values(payload.errors as Record<string, unknown[]>)
            .flat()
            .filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [];

    if (validationErrors.length > 0) return validationErrors[0];
    if (error.status === 0) return 'No se pudo conectar con el backend. Verifica que la API este ejecutandose.';
    return 'La operacion no pudo completarse. Revisa los datos e intenta nuevamente.';
  }
}
