import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ToastNotification, ToastType } from '../../../../shared/domain/models/toast-notification.model';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';

import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Tournament } from '../../domain/models/tournament.model';
import { TournamentStatus } from '../../domain/models/tournament-status.type';
import { TournamentUpsertPayload } from '../../domain/models/tournament-upsert.model';
import { TournamentApiService } from '../../infrastructure/repositories/tournament-api.service';

@Component({
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, ConfirmDialogComponent, ToastStackComponent],
  templateUrl: './tournaments-page.component.html',
  styleUrl: './tournaments-page.component.scss',
})
export class TournamentsPageComponent {
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly tournaments = signal<Tournament[]>([]);
  protected readonly teams = signal<Team[]>([]);
  protected readonly selectedTournamentTeams = signal<Team[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isTeamsLoading = signal(true);
  protected readonly isTournamentTeamsLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isFormModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly isRegisterTeamsModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly tournamentBeingEdited = signal<Tournament | null>(null);
  protected readonly tournamentPendingDelete = signal<Tournament | null>(null);
  protected readonly tournamentForRegistration = signal<Tournament | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedTeamId = signal(0);
  protected readonly filteredTournaments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.tournaments();
    return this.tournaments().filter((t) =>
      [t.name, t.season, t.status].some((value) => value.toLowerCase().includes(term)),
    );
  });
  protected readonly pendingCount = computed(
    () => this.filteredTournaments().filter((t) => t.status === 'Pending').length,
  );
  protected readonly activeCount = computed(
    () => this.filteredTournaments().filter((t) => t.status === 'InProgress').length,
  );
  protected readonly submitLabel = computed(() =>
    this.tournamentBeingEdited() ? 'Guardar cambios' : 'Crear torneo',
  );
  protected readonly modalTitle = computed(() =>
    this.tournamentBeingEdited() ? 'Editar torneo' : 'Crear torneo',
  );
  protected readonly selectedTournamentStatusCopy = computed(() => {
    const tournament = this.tournamentForRegistration();

    if (!tournament) {
      return '';
    }

    return tournament.status === 'Pending'
      ? 'Puedes inscribir equipos mientras el torneo siga pendiente.'
      : 'La inscripcion de equipos solo esta disponible cuando el torneo esta pendiente.';
  });
  protected readonly availableTeamsForRegistration = computed(() => {
    const selectedIds = new Set(this.selectedTournamentTeams().map((team) => team.id));
    return this.teams().filter((team) => !selectedIds.has(team.id));
  });
  protected readonly remainingTeamsCount = computed(() => this.availableTeamsForRegistration().length);
  protected readonly canSubmitTournamentForm = computed(
    () => !this.isSaving() && !this.hasDateRangeError(),
  );
  protected readonly canRegisterSelectedTeam = computed(
    () =>
      this.selectedTeamId() > 0 &&
      !this.isSaving() &&
      !this.isTeamsLoading() &&
      this.remainingTeamsCount() > 0,
  );
  protected readonly tournamentForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    season: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  constructor() {
    this.loadTournaments();
    this.loadTeams();
  }

  protected trackByTournamentId(_: number, tournament: Tournament): number {
    return tournament.id;
  }

  protected retry(): void {
    this.loadTournaments();
    this.loadTeams();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected openCreateModal(): void {
    this.tournamentBeingEdited.set(null);
    this.tournamentForm.reset({ name: '', season: '', startDate: '', endDate: '' });
    this.tournamentForm.markAsPristine();
    this.tournamentForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(tournament: Tournament): void {
    this.tournamentBeingEdited.set(tournament);
    this.tournamentForm.reset({
      name: tournament.name,
      season: tournament.season,
      startDate: this.toDateInputValue(tournament.startDate),
      endDate: this.toDateInputValue(tournament.endDate),
    });
    this.tournamentForm.markAsPristine();
    this.tournamentForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    if (!this.isSaving()) this.isFormModalOpen.set(false);
  }

  protected openDeleteModal(tournament: Tournament): void {
    this.tournamentPendingDelete.set(tournament);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.tournamentPendingDelete.set(null);
    }
  }

  protected openRegisterTeamsModal(tournament: Tournament): void {
    this.tournamentForRegistration.set(tournament);
    this.selectedTeamId.set(0);
    this.isRegisterTeamsModalOpen.set(true);
    this.loadTournamentTeams(tournament.id);
  }

  protected closeRegisterTeamsModal(): void {
    if (!this.isSaving()) {
      this.isRegisterTeamsModalOpen.set(false);
      this.tournamentForRegistration.set(null);
      this.selectedTournamentTeams.set([]);
      this.selectedTeamId.set(0);
    }
  }

  protected updateSelectedTeamId(value: number): void {
    this.selectedTeamId.set(value);
  }

  protected submitTournamentForm(): void {
    if (this.tournamentForm.invalid) {
      this.tournamentForm.markAllAsTouched();
      return;
    }

    const editingTournament = this.tournamentBeingEdited();
    const payload = this.buildPayload();
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

  protected confirmDelete(): void {
    const tournament = this.tournamentPendingDelete();
    if (!tournament) return;

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

  protected advanceStatus(tournament: Tournament): void {
    const nextStatus = this.getNextStatus(tournament.status);
    if (!nextStatus) return;

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
        this.pushNotification('error', 'No se pudo actualizar el estado', parseApiErrorMessage(error));
      },
    });
  }

  protected registerSelectedTeam(): void {
    const tournament = this.tournamentForRegistration();
    const teamId = this.selectedTeamId();
    if (!tournament || teamId <= 0) return;

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
        this.pushNotification('error', 'No se pudo inscribir el equipo', parseApiErrorMessage(error));
      },
    });
  }

  protected dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  protected fieldHasError(fieldName: keyof typeof this.tournamentForm.controls): boolean {
    const control = this.tournamentForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getFieldError(fieldName: keyof typeof this.tournamentForm.controls): string {
    const control = this.tournamentForm.controls[fieldName];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) return 'El valor es demasiado corto.';
    if (control.hasError('maxlength')) return 'El valor supera la longitud permitida.';
    return 'Revisa este campo.';
  }

  protected hasDateRangeError(): boolean {
    const { startDate, endDate } = this.tournamentForm.getRawValue();

    if (!startDate || !endDate) {
      return false;
    }

    return new Date(endDate).getTime() <= new Date(startDate).getTime();
  }

  protected canEdit(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  protected canDelete(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  protected canRegisterTeams(tournament: Tournament): boolean {
    return tournament.status === 'Pending';
  }

  protected canAdvanceStatus(tournament: Tournament): boolean {
    return tournament.status !== 'Finished';
  }

  protected getStatusLabel(status: TournamentStatus): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'InProgress':
        return 'En curso';
      case 'Finished':
        return 'Finalizado';
    }
  }

  protected getStatusActionLabel(status: TournamentStatus): string {
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

  private buildPayload(): TournamentUpsertPayload {
    const { name, season, startDate, endDate } = this.tournamentForm.getRawValue();
    return { name: name.trim(), season: season.trim(), startDate, endDate };
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

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  private pushNotification(type: ToastType, title: string, message: string): void {
    pushToastNotification(this.notifications, (notificationId) => this.dismissNotification(notificationId), type, title, message);
  }
}
