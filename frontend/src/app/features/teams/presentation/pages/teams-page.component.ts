import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';

import { Team } from '../../domain/models/team.model';
import { TeamUpsertPayload } from '../../domain/models/team-upsert.model';
import { TeamApiService } from '../../infrastructure/repositories/team-api.service';

type ToastType = 'success' | 'error';

type ToastNotification = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, ConfirmDialogComponent, ToastStackComponent],
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
})
export class TeamsPageComponent {
  private readonly teamApi = inject(TeamApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly teams = signal<Team[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isFormModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly teamBeingEdited = signal<Team | null>(null);
  protected readonly teamPendingDelete = signal<Team | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly filteredTeams = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.teams();
    }

    return this.teams().filter((team) =>
      [team.name, team.city, team.stadium].some((value) => value.toLowerCase().includes(term)),
    );
  });
  protected readonly uniqueCitiesCount = computed(
    () => new Set(this.filteredTeams().map((team) => team.city.trim().toLowerCase())).size,
  );
  protected readonly submitLabel = computed(() =>
    this.teamBeingEdited() ? 'Guardar cambios' : 'Crear equipo',
  );
  protected readonly modalTitle = computed(() =>
    this.teamBeingEdited() ? 'Editar equipo' : 'Crear equipo',
  );
  protected readonly teamForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    stadium: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    logoUrl: ['', [Validators.maxLength(500)]],
    foundedDate: ['', [Validators.required]],
  });

  constructor() {
    this.loadTeams();
  }

  protected trackByTeamId(_: number, team: Team): number {
    return team.id;
  }

  protected retry(): void {
    this.loadTeams();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected openCreateModal(): void {
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

  protected openEditModal(team: Team): void {
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

  protected closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  protected openDeleteModal(team: Team): void {
    this.teamPendingDelete.set(team);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.teamPendingDelete.set(null);
    }
  }

  protected submitTeamForm(): void {
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
          this.getErrorMessage(error),
        );
      },
    });
  }

  protected confirmDelete(): void {
    const team = this.teamPendingDelete();

    if (!team) {
      return;
    }

    this.isSaving.set(true);

    this.teamApi
      .delete(team.id)
      .subscribe({
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
          this.pushNotification('error', 'No se pudo eliminar', this.getErrorMessage(error));
        },
      });
  }

  protected dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  protected fieldHasError(fieldName: keyof typeof this.teamForm.controls): boolean {
    const control = this.teamForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getFieldError(fieldName: keyof typeof this.teamForm.controls): string {
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

  private loadTeams(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.teamApi
      .getAll()
      .subscribe({
        next: (teams) => {
          this.teams.set(teams);
          this.searchTerm.set('');
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.getErrorMessage(error));
          this.isLoading.set(false);
        },
      });
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
