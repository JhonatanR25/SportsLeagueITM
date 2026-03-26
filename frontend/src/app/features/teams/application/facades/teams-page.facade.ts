import { inject, Injectable, signal, computed } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ToastNotification, ToastType } from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Team } from '../../domain/models/team.model';
import { TeamUpsertPayload } from '../../domain/models/team-upsert.model';
import { TeamApiService } from '../../infrastructure/repositories/team-api.service';

@Injectable()
export class TeamsPageFacade {
  private readonly teamApi = inject(TeamApiService);
  private readonly formBuilder = inject(FormBuilder);

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
  readonly filteredTeams = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.teams();
    }

    return this.teams().filter((team) =>
      [team.name, team.city, team.stadium].some((value) => value.toLowerCase().includes(term)),
    );
  });
  readonly uniqueCitiesCount = computed(
    () => new Set(this.filteredTeams().map((team) => team.city.trim().toLowerCase())).size,
  );
  readonly submitLabel = computed(() => (this.teamBeingEdited() ? 'Guardar cambios' : 'Crear equipo'));
  readonly modalTitle = computed(() => (this.teamBeingEdited() ? 'Editar equipo' : 'Crear equipo'));
  readonly formModeLabel = computed(() =>
    this.teamBeingEdited() ? 'Edicion de equipo' : 'Creacion de equipo',
  );
  readonly logoPreview = computed(() => {
    const logoUrl = this.teamForm.controls.logoUrl.value.trim();
    const teamName = this.teamForm.controls.name.value.trim();

    return {
      logoUrl,
      initials: (teamName || 'EQ').slice(0, 2).toUpperCase(),
    };
  });
  readonly teamForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    stadium: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    logoUrl: ['', [Validators.maxLength(500)]],
    foundedDate: ['', [Validators.required]],
  });

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
    this.teamForm.reset({
      name: '',
      city: '',
      stadium: '',
      logoUrl: '',
      foundedDate: '',
    });
    this.teamForm.markAsPristine();
    this.teamForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  openEditModal(team: Team): void {
    this.teamBeingEdited.set(team);
    this.teamForm.reset({
      name: team.name,
      city: team.city,
      stadium: team.stadium,
      logoUrl: team.logoUrl ?? '',
      foundedDate: this.toDateInputValue(team.foundedDate),
    });
    this.teamForm.markAsPristine();
    this.teamForm.markAsUntouched();
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
    const payload = this.buildPayload();
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
    const control = this.teamForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.teamForm.controls): string {
    const control = this.teamForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('minlength')) {
      return 'El valor es demasiado corto.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor supera la longitud permitida.';
    }

    return 'Revisa este campo.';
  }

  canSubmitForm(): boolean {
    return !this.isSaving();
  }

  private buildPayload(): TeamUpsertPayload {
    const { name, city, stadium, logoUrl, foundedDate } = this.teamForm.getRawValue();

    return {
      name: name.trim(),
      city: city.trim(),
      stadium: stadium.trim(),
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
      foundedDate,
    };
  }

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
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
