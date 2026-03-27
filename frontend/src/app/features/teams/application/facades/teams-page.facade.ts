import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ToastNotification,
  ToastType,
} from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Team } from '../../domain/models/team.model';
import { TeamApiService } from '../../infrastructure/repositories/team-api.service';
import { TeamsFormService } from './teams-form.service';

@Injectable()
export class TeamsPageFacade {
  private readonly teamApi = inject(TeamApiService);
  private readonly formService = inject(TeamsFormService);

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly teamBeingEdited = signal<Team | null>(null);
  readonly teamPendingDelete = signal<Team | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly searchTerm = signal('');
  readonly teamForm = this.formService.teamForm;
  readonly filteredTeams = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.teams();
    }

    return this.teams().filter((team) =>
      [team.name, team.city, team.stadium].some((value) => value.toLowerCase().includes(term)),
    );
  });
  readonly submitLabel = computed(() =>
    this.teamBeingEdited() ? 'Guardar cambios' : 'Crear equipo',
  );
  readonly modalTitle = computed(() => (this.teamBeingEdited() ? 'Editar equipo' : 'Crear equipo'));
  readonly formModeLabel = computed(() =>
    this.teamBeingEdited() ? 'Edicion de equipo' : 'Creacion de equipo',
  );
  readonly logoPreview = this.formService.logoPreview;

  loadTeams(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teamApi.getAll().subscribe({
      next: (teams) => {
        this.teams.set(teams);
        this.searchTerm.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(parseApiErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    this.loadTeams();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.teamBeingEdited.set(null);
    this.formService.resetForCreate();
    this.isFormModalOpen.set(true);
  }

  openEditModal(team: Team): void {
    this.teamBeingEdited.set(team);
    this.formService.resetForEdit(team);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  openDeleteModal(team: Team): void {
    this.teamPendingDelete.set(team);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.teamPendingDelete.set(null);
    }
  }

  submitTeamForm(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const editingTeam = this.teamBeingEdited();
    const payload = this.formService.buildPayload();
    const request$: Observable<unknown> = editingTeam
      ? this.teamApi.update(editingTeam.id, payload)
      : this.teamApi.create(payload);

    this.isSaving.set(true);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormModalOpen.set(false);
        this.pushNotification(
          'success',
          editingTeam ? 'Equipo actualizado' : 'Equipo creado',
          editingTeam
            ? 'Los cambios se guardaron correctamente.'
            : 'El nuevo equipo se registro correctamente.',
        );
        this.loadTeams();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          editingTeam ? 'No se pudo actualizar' : 'No se pudo crear',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  confirmDelete(): void {
    const team = this.teamPendingDelete();

    if (!team) {
      return;
    }

    this.isSaving.set(true);

    this.teamApi.delete(team.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isDeleteModalOpen.set(false);
        this.teamPendingDelete.set(null);
        this.pushNotification(
          'success',
          'Equipo eliminado',
          `El equipo "${team.name}" fue eliminado correctamente.`,
        );
        this.loadTeams();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo eliminar', parseApiErrorMessage(error));
      },
    });
  }

  dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  fieldHasError(fieldName: keyof typeof this.teamForm.controls): boolean {
    return this.formService.fieldHasError(fieldName);
  }

  getFieldError(fieldName: keyof typeof this.teamForm.controls): string {
    return this.formService.getFieldError(fieldName);
  }

  canSubmitForm(): boolean {
    return !this.isSaving();
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
