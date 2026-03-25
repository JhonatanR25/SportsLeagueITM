import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Referee } from '../../domain/models/referee.model';
import { RefereeUpsertPayload } from '../../domain/models/referee-upsert.model';
import { RefereeApiService } from '../../infrastructure/repositories/referee-api.service';

type ToastType = 'success' | 'error';

type ToastNotification = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

@Component({
  selector: 'app-referees-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './referees-page.component.html',
  styleUrl: './referees-page.component.scss',
})
export class RefereesPageComponent {
  private readonly refereeApi = inject(RefereeApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly referees = signal<Referee[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isFormModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly refereeBeingEdited = signal<Referee | null>(null);
  protected readonly refereePendingDelete = signal<Referee | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly filteredReferees = computed(() => {
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
  protected readonly uniqueNationalitiesCount = computed(
    () => new Set(this.filteredReferees().map((referee) => referee.nationality.trim().toLowerCase())).size,
  );
  protected readonly submitLabel = computed(() =>
    this.refereeBeingEdited() ? 'Guardar cambios' : 'Crear arbitro',
  );
  protected readonly modalTitle = computed(() =>
    this.refereeBeingEdited() ? 'Editar arbitro' : 'Crear arbitro',
  );
  protected readonly refereeForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    nationality: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

  constructor() {
    this.loadReferees();
  }

  protected trackByRefereeId(_: number, referee: Referee): number {
    return referee.id;
  }

  protected retry(): void {
    this.loadReferees();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected openCreateModal(): void {
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

  protected openEditModal(referee: Referee): void {
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

  protected closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  protected openDeleteModal(referee: Referee): void {
    this.refereePendingDelete.set(referee);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.refereePendingDelete.set(null);
    }
  }

  protected submitRefereeForm(): void {
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
          this.getErrorMessage(error),
        );
      },
    });
  }

  protected confirmDelete(): void {
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
        this.pushNotification('error', 'No se pudo eliminar', this.getErrorMessage(error));
      },
    });
  }

  protected dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  protected fieldHasError(fieldName: keyof typeof this.refereeForm.controls): boolean {
    const control = this.refereeForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getFieldError(fieldName: keyof typeof this.refereeForm.controls): string {
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

  private loadReferees(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.refereeApi.getAll().subscribe({
      next: (referees) => {
        this.referees.set(referees);
        this.searchTerm.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
        this.isLoading.set(false);
      },
    });
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
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.notifications.update((items) => [...items, { id, type, title, message }]);

    window.setTimeout(() => {
      this.dismissNotification(id);
    }, 4500);
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrio un error inesperado. Intenta nuevamente.';
    }

    const payload = error.error as
      | { message?: string; detail?: string; errors?: Record<string, string[]> }
      | string
      | null;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

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

    if (validationErrors.length > 0) {
      return validationErrors[0];
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Verifica que la API este ejecutandose.';
    }

    return 'La operacion no pudo completarse. Revisa los datos e intenta nuevamente.';
  }
}
