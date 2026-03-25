import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';

import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Player } from '../../domain/models/player.model';
import { PlayerPosition } from '../../domain/models/player-position.type';
import { PlayerUpsertPayload } from '../../domain/models/player-upsert.model';
import { PlayerApiService } from '../../infrastructure/repositories/player-api.service';

type ToastType = 'success' | 'error';

type ToastNotification = {
  id: number;
  type: ToastType;
  title: string;
  message: string;
};

type PositionOption = {
  value: PlayerPosition;
  label: string;
};

@Component({
  selector: 'app-players-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, ConfirmDialogComponent, ToastStackComponent],
  templateUrl: './players-page.component.html',
  styleUrl: './players-page.component.scss',
})
export class PlayersPageComponent {
  private readonly playerApi = inject(PlayerApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly players = signal<Player[]>([]);
  protected readonly teams = signal<Team[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isTeamsLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isFormModalOpen = signal(false);
  protected readonly isDeleteModalOpen = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly playerBeingEdited = signal<Player | null>(null);
  protected readonly playerPendingDelete = signal<Player | null>(null);
  protected readonly notifications = signal<ToastNotification[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly filteredPlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.players();
    }

    return this.players().filter((player) =>
      [
        `${player.firstName} ${player.lastName}`,
        player.teamName,
        player.position,
        String(player.number),
      ].some((value) => value.toLowerCase().includes(term)),
    );
  });
  protected readonly uniqueTeamsCount = computed(
    () => new Set(this.filteredPlayers().map((player) => player.teamName.trim().toLowerCase())).size,
  );
  protected readonly submitLabel = computed(() =>
    this.playerBeingEdited() ? 'Guardar cambios' : 'Crear jugador',
  );
  protected readonly modalTitle = computed(() =>
    this.playerBeingEdited() ? 'Editar jugador' : 'Crear jugador',
  );
  protected readonly positionOptions: PositionOption[] = [
    { value: 'Goalkeeper', label: 'Portero' },
    { value: 'Defender', label: 'Defensa' },
    { value: 'Midfielder', label: 'Mediocampista' },
    { value: 'Forward', label: 'Delantero' },
  ];
  protected readonly playerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    birthDate: ['', [Validators.required]],
    number: [0, [Validators.required, Validators.min(1), Validators.max(999)]],
    position: ['Goalkeeper' as PlayerPosition, [Validators.required]],
    teamId: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.loadPlayers();
    this.loadTeams();
  }

  protected trackByPlayerId(_: number, player: Player): number {
    return player.id;
  }

  protected retry(): void {
    this.loadPlayers();
    this.loadTeams();
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected openCreateModal(): void {
    this.playerBeingEdited.set(null);
    this.playerForm.reset({
      firstName: '',
      lastName: '',
      birthDate: '',
      number: 0,
      position: 'Goalkeeper',
      teamId: 0,
    });
    this.playerForm.markAsPristine();
    this.playerForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(player: Player): void {
    this.playerBeingEdited.set(player);
    this.playerForm.reset({
      firstName: player.firstName,
      lastName: player.lastName,
      birthDate: this.toDateInputValue(player.birthDate),
      number: player.number,
      position: player.position,
      teamId: player.teamId,
    });
    this.playerForm.markAsPristine();
    this.playerForm.markAsUntouched();
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  protected openDeleteModal(player: Player): void {
    this.playerPendingDelete.set(player);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.playerPendingDelete.set(null);
    }
  }

  protected submitPlayerForm(): void {
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      return;
    }

    const editingPlayer = this.playerBeingEdited();
    const payload = this.buildPayload();
    const request$: Observable<unknown> = editingPlayer
      ? this.playerApi.update(editingPlayer.id, payload)
      : this.playerApi.create(payload);

    this.isSaving.set(true);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormModalOpen.set(false);
        this.pushNotification(
          'success',
          editingPlayer ? 'Jugador actualizado' : 'Jugador creado',
          editingPlayer
            ? 'Los cambios del jugador se guardaron correctamente.'
            : 'El nuevo jugador se registro correctamente.',
        );
        this.loadPlayers();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          editingPlayer ? 'No se pudo actualizar' : 'No se pudo crear',
          this.getErrorMessage(error),
        );
      },
    });
  }

  protected confirmDelete(): void {
    const player = this.playerPendingDelete();

    if (!player) {
      return;
    }

    this.isSaving.set(true);

    this.playerApi.delete(player.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isDeleteModalOpen.set(false);
        this.playerPendingDelete.set(null);
        this.pushNotification(
          'success',
          'Jugador eliminado',
          `El jugador "${player.firstName} ${player.lastName}" fue eliminado correctamente.`,
        );
        this.loadPlayers();
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

  protected fieldHasError(fieldName: keyof typeof this.playerForm.controls): boolean {
    const control = this.playerForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getFieldError(fieldName: keyof typeof this.playerForm.controls): string {
    const control = this.playerForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('minlength')) {
      return 'El valor es demasiado corto.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor supera la longitud permitida.';
    }

    if (control.hasError('min') || control.hasError('max')) {
      return 'El valor esta fuera del rango permitido.';
    }

    return 'Revisa este campo.';
  }

  protected getPositionLabel(position: PlayerPosition): string {
    return this.positionOptions.find((option) => option.value === position)?.label ?? position;
  }

  private loadPlayers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.playerApi.getAll().subscribe({
      next: (players) => {
        this.players.set(players);
        this.searchTerm.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.getErrorMessage(error));
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

  private buildPayload(): PlayerUpsertPayload {
    const { firstName, lastName, birthDate, number, position, teamId } =
      this.playerForm.getRawValue();

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      number,
      position,
      teamId,
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
