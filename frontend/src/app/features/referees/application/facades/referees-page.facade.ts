import { computed, inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ToastNotification, ToastType } from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Referee } from '../../domain/models/referee.model';
import { RefereeUpsertPayload } from '../../domain/models/referee-upsert.model';
import { RefereeApiService } from '../../infrastructure/repositories/referee-api.service';

@Injectable()
export class RefereesPageFacade {
  private readonly refereeApi = inject(RefereeApiService);
  private readonly formBuilder = inject(FormBuilder);

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
  readonly uniqueNationalitiesCount = computed(
    () =>
      new Set(this.filteredReferees().map((referee) => referee.nationality.trim().toLowerCase()))
        .size,
  );
  readonly submitLabel = computed(() =>
    this.refereeBeingEdited() ? 'Guardar cambios' : 'Crear arbitro',
  );
  readonly modalTitle = computed(() =>
    this.refereeBeingEdited() ? 'Editar arbitro' : 'Crear arbitro',
  );
  readonly formModeLabel = computed(() =>
    this.refereeBeingEdited() ? 'Edicion de arbitro' : 'Creacion de arbitro',
  );
  readonly refereePreview = computed(() => {
    const firstName = this.refereeForm.controls.firstName.value.trim();
    const lastName = this.refereeForm.controls.lastName.value.trim();
    const nationality = this.refereeForm.controls.nationality.value.trim();

    return {
      initials: `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.trim().toUpperCase() || 'AR',
      fullName: `${firstName} ${lastName}`.trim() || 'Nombre del arbitro',
      nationality: nationality || 'Nacionalidad pendiente',
    };
  });
  readonly refereeForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    nationality: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

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
    this.refereeForm.reset({
      firstName: '',
      lastName: '',
      nationality: '',
    });
    this.refereeForm.markAsPristine();
    this.refereeForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  openEditModal(referee: Referee): void {
    this.refereeBeingEdited.set(referee);
    this.refereeForm.reset({
      firstName: referee.firstName,
      lastName: referee.lastName,
      nationality: referee.nationality,
    });
    this.refereeForm.markAsPristine();
    this.refereeForm.markAsUntouched();
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
    const payload = this.buildPayload();
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
    const control = this.refereeForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.refereeForm.controls): string {
    const control = this.refereeForm.controls[fieldName];

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

  private buildPayload(): RefereeUpsertPayload {
    const { firstName, lastName, nationality } = this.refereeForm.getRawValue();

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality: nationality.trim(),
    };
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
