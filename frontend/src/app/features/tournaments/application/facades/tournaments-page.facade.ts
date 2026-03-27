import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ToastNotification,
  ToastType,
} from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Tournament } from '../../domain/models/tournament.model';
import { TournamentStatus } from '../../domain/models/tournament-status.type';
import { TournamentApiService } from '../../infrastructure/repositories/tournament-api.service';
import { TournamentsFormService } from './tournaments-form.service';

@Injectable()
export class TournamentsPageFacade {
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly formService = inject(TournamentsFormService);

  readonly tournaments = signal<Tournament[]>([]);
  readonly teams = signal<Team[]>([]);
  readonly selectedTournamentTeams = signal<Team[]>([]);
  readonly isLoading = signal(true);
  readonly isTeamsLoading = signal(true);
  readonly isTournamentTeamsLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isRegisterTeamsModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly tournamentBeingEdited = signal<Tournament | null>(null);
  readonly tournamentPendingDelete = signal<Tournament | null>(null);
  readonly tournamentForRegistration = signal<Tournament | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly searchTerm = signal('');
  readonly selectedTeamId = signal(0);
  readonly tournamentForm = this.formService.tournamentForm;
  readonly filteredTournaments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.tournaments();
    }

    return this.tournaments().filter((tournament) =>
      [tournament.name, tournament.season, tournament.status].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  });
  readonly pendingCount = computed(
    () => this.filteredTournaments().filter((tournament) => tournament.status === 'Pending').length,
  );
  readonly activeCount = computed(
    () =>
      this.filteredTournaments().filter((tournament) => tournament.status === 'InProgress').length,
  );
  readonly submitLabel = computed(() =>
    this.tournamentBeingEdited() ? 'Guardar cambios' : 'Crear torneo',
  );
  readonly modalTitle = computed(() =>
    this.tournamentBeingEdited() ? 'Editar torneo' : 'Crear torneo',
  );
  readonly formModeLabel = computed(() =>
    this.tournamentBeingEdited() ? 'Edicion de torneo' : 'Creacion de torneo',
  );
  readonly selectedTournamentStatusCopy = computed(() => {
    const tournament = this.tournamentForRegistration();

    if (!tournament) {
      return '';
    }

    return tournament.status === 'Pending'
      ? 'Puedes inscribir equipos mientras el torneo siga pendiente.'
      : 'La inscripcion de equipos solo esta disponible cuando el torneo esta pendiente.';
  });
  readonly availableTeamsForRegistration = computed(() => {
    const selectedIds = new Set(this.selectedTournamentTeams().map((team) => team.id));
    return this.teams().filter((team) => !selectedIds.has(team.id));
  });
  readonly remainingTeamsCount = computed(() => this.availableTeamsForRegistration().length);
  readonly canSubmitTournamentForm = computed(() => !this.isSaving() && !this.hasDateRangeError());
  readonly canRegisterSelectedTeam = computed(
    () =>
      this.selectedTeamId() > 0 &&
      !this.isSaving() &&
      !this.isTeamsLoading() &&
      this.remainingTeamsCount() > 0,
  );
  loadInitialData(): void {
    this.loadTournaments();
    this.loadTeams();
  }

  retry(): void {
    this.loadTournaments();
    this.loadTeams();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.tournamentBeingEdited.set(null);
    this.formService.resetForCreate();
    this.isFormModalOpen.set(true);
  }

  openEditModal(tournament: Tournament): void {
    this.tournamentBeingEdited.set(tournament);
    this.formService.resetForEdit(tournament);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  openDeleteModal(tournament: Tournament): void {
    this.tournamentPendingDelete.set(tournament);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.tournamentPendingDelete.set(null);
    }
  }

  openRegisterTeamsModal(tournament: Tournament): void {
    this.tournamentForRegistration.set(tournament);
    this.selectedTeamId.set(0);
    this.isRegisterTeamsModalOpen.set(true);
    this.loadTournamentTeams(tournament.id);
  }

  closeRegisterTeamsModal(): void {
    if (!this.isSaving()) {
      this.isRegisterTeamsModalOpen.set(false);
      this.tournamentForRegistration.set(null);
      this.selectedTournamentTeams.set([]);
      this.selectedTeamId.set(0);
    }
  }

  updateSelectedTeamId(value: number): void {
    this.selectedTeamId.set(value);
  }

  submitTournamentForm(): void {
    if (this.tournamentForm.invalid) {
      this.tournamentForm.markAllAsTouched();
      return;
    }

    const editingTournament = this.tournamentBeingEdited();
    const payload = this.formService.buildPayload();
    const request$: Observable<unknown> = editingTournament
      ? this.tournamentApi.update(editingTournament.id, payload)
      : this.tournamentApi.create(payload);

    this.isSaving.set(true);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormModalOpen.set(false);
        this.pushNotification(
          'success',
          editingTournament ? 'Torneo actualizado' : 'Torneo creado',
          editingTournament
            ? 'Los cambios del torneo se guardaron correctamente.'
            : 'El nuevo torneo se registro correctamente.',
        );
        this.loadTournaments();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          editingTournament ? 'No se pudo actualizar' : 'No se pudo crear',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  confirmDelete(): void {
    const tournament = this.tournamentPendingDelete();

    if (!tournament) {
      return;
    }

    this.isSaving.set(true);
    this.tournamentApi.delete(tournament.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isDeleteModalOpen.set(false);
        this.tournamentPendingDelete.set(null);
        this.pushNotification(
          'success',
          'Torneo eliminado',
          `El torneo "${tournament.name}" fue eliminado correctamente.`,
        );
        this.loadTournaments();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo eliminar', parseApiErrorMessage(error));
      },
    });
  }

  advanceStatus(tournament: Tournament): void {
    const nextStatus = this.getNextStatus(tournament.status);

    if (!nextStatus) {
      return;
    }

    this.isSaving.set(true);
    this.tournamentApi.updateStatus(tournament.id, nextStatus).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.pushNotification(
          'success',
          'Estado actualizado',
          `El torneo "${tournament.name}" paso a ${this.getStatusLabel(nextStatus)}.`,
        );
        this.loadTournaments();
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

  registerSelectedTeam(): void {
    const tournament = this.tournamentForRegistration();
    const teamId = this.selectedTeamId();

    if (!tournament || teamId <= 0) {
      return;
    }

    this.isSaving.set(true);
    this.tournamentApi.registerTeam(tournament.id, teamId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.selectedTeamId.set(0);
        this.pushNotification('success', 'Equipo inscrito', 'El equipo fue inscrito exitosamente.');
        this.loadTournamentTeams(tournament.id);
        this.loadTournaments();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          'No se pudo inscribir el equipo',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  fieldHasError(fieldName: keyof typeof this.tournamentForm.controls): boolean {
    return this.formService.fieldHasError(fieldName);
  }

  getFieldError(fieldName: keyof typeof this.tournamentForm.controls): string {
    return this.formService.getFieldError(fieldName);
  }

  hasDateRangeError(): boolean {
    return this.formService.hasDateRangeError();
  }

  canEdit(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  canDelete(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  canRegisterTeams(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  canAdvanceStatus(tournament: Tournament): boolean {
    return tournament.status !== 'Finished';
  }

  getStatusLabel(status: TournamentStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'InProgress':
        return 'En curso';
      case 'Finished':
        return 'Finalizado';
    }
  }

  getStatusActionLabel(status: TournamentStatus): string {
    switch (status) {
      case 'Pending':
        return 'Iniciar torneo';
      case 'InProgress':
        return 'Finalizar torneo';
      case 'Finished':
        return 'Torneo cerrado';
    }
  }

  private loadTournaments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.tournamentApi.getAll().subscribe({
      next: (items) => {
        this.tournaments.set(items);
        this.searchTerm.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(parseApiErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  private loadTeams(): void {
    this.isTeamsLoading.set(true);

    this.teamApi.getAll().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.isTeamsLoading.set(false);
      },
      error: () => {
        this.isTeamsLoading.set(false);
      },
    });
  }

  private loadTournamentTeams(tournamentId: number): void {
    this.isTournamentTeamsLoading.set(true);
    this.selectedTournamentTeams.set([]);

    this.tournamentApi.getTeams(tournamentId).subscribe({
      next: (teams) => {
        this.selectedTournamentTeams.set(teams);
        this.isTournamentTeamsLoading.set(false);
      },
      error: () => {
        this.isTournamentTeamsLoading.set(false);
      },
    });
  }

  private getNextStatus(status: TournamentStatus): TournamentStatus | null {
    switch (status) {
      case 'Pending':
        return 'InProgress';
      case 'InProgress':
        return 'Finished';
      case 'Finished':
        return null;
    }
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
