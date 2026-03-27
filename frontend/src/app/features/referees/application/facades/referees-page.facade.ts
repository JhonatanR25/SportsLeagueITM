import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ToastNotification,
  ToastType,
} from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Referee } from '../../domain/models/referee.model';
import { RefereeApiService } from '../../infrastructure/repositories/referee-api.service';
import { RefereesFormService } from './referees-form.service';

@Injectable()
export class RefereesPageFacade {
  private readonly refereeApi = inject(RefereeApiService);
  private readonly formService = inject(RefereesFormService);

  readonly referees = signal<Referee[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly refereeBeingEdited = signal<Referee | null>(null);
  readonly refereePendingDelete = signal<Referee | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly searchTerm = signal('');
  readonly refereeForm = this.formService.refereeForm;
  readonly filteredReferees = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.referees();
    }

    return this.referees().filter((referee) =>
      [`${referee.firstName} ${referee.lastName}`, referee.nationality].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  });
  readonly submitLabel = computed(() =>
    this.refereeBeingEdited() ? 'Guardar cambios' : 'Crear arbitro',
  );
  readonly modalTitle = computed(() =>
    this.refereeBeingEdited() ? 'Editar arbitro' : 'Crear arbitro',
  );
  readonly formModeLabel = computed(() =>
    this.refereeBeingEdited() ? 'Edicion de arbitro' : 'Creacion de arbitro',
  );
  readonly refereePreview = this.formService.refereePreview;

  loadReferees(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.refereeApi.getAll().subscribe({
      next: (referees) => {
        this.referees.set(referees);
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
    this.loadReferees();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.refereeBeingEdited.set(null);
    this.formService.resetForCreate();
    this.isFormModalOpen.set(true);
  }

  openEditModal(referee: Referee): void {
    this.refereeBeingEdited.set(referee);
    this.formService.resetForEdit(referee);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  openDeleteModal(referee: Referee): void {
    this.refereePendingDelete.set(referee);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.refereePendingDelete.set(null);
    }
  }

  submitRefereeForm(): void {
    if (this.refereeForm.invalid) {
      this.refereeForm.markAllAsTouched();
      return;
    }

    const editingReferee = this.refereeBeingEdited();
    const payload = this.formService.buildPayload();
    const request$: Observable<unknown> = editingReferee
      ? this.refereeApi.update(editingReferee.id, payload)
      : this.refereeApi.create(payload);

    this.isSaving.set(true);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormModalOpen.set(false);
        this.pushNotification(
          'success',
          editingReferee ? 'Arbitro actualizado' : 'Arbitro creado',
          editingReferee
            ? 'Los cambios del arbitro se guardaron correctamente.'
            : 'El nuevo arbitro se registro correctamente.',
        );
        this.loadReferees();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          editingReferee ? 'No se pudo actualizar' : 'No se pudo crear',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  confirmDelete(): void {
    const referee = this.refereePendingDelete();

    if (!referee) {
      return;
    }

    this.isSaving.set(true);

    this.refereeApi.delete(referee.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isDeleteModalOpen.set(false);
        this.refereePendingDelete.set(null);
        this.pushNotification(
          'success',
          'Arbitro eliminado',
          `El arbitro "${referee.firstName} ${referee.lastName}" fue eliminado correctamente.`,
        );
        this.loadReferees();
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

  fieldHasError(fieldName: keyof typeof this.refereeForm.controls): boolean {
    return this.formService.fieldHasError(fieldName);
  }

  getFieldError(fieldName: keyof typeof this.refereeForm.controls): string {
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
