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
import { Player } from '../../domain/models/player.model';
import { PlayerPosition } from '../../domain/models/player-position.type';
import { PlayerApiService } from '../../infrastructure/repositories/player-api.service';
import { PlayersFormService } from './players-form.service';

@Injectable()
export class PlayersPageFacade {
  private readonly playerApi = inject(PlayerApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly formService = inject(PlayersFormService);

  readonly players = signal<Player[]>([]);
  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(true);
  readonly isTeamsLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly playerBeingEdited = signal<Player | null>(null);
  readonly playerPendingDelete = signal<Player | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly searchTerm = signal('');
  readonly playerForm = this.formService.playerForm;
  readonly filteredPlayers = computed(() => {
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
  readonly submitLabel = computed(() =>
    this.playerBeingEdited() ? 'Guardar cambios' : 'Crear jugador',
  );
  readonly modalTitle = computed(() =>
    this.playerBeingEdited() ? 'Editar jugador' : 'Crear jugador',
  );
  readonly formModeLabel = computed(() =>
    this.playerBeingEdited() ? 'Edicion de jugador' : 'Creacion de jugador',
  );
  readonly playerPreview = this.formService.createPreview(this.teams);
  readonly positionOptions = this.formService.positionOptions;

  loadInitialData(): void {
    this.loadPlayers();
    this.loadTeams();
  }

  retry(): void {
    this.loadPlayers();
    this.loadTeams();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.playerBeingEdited.set(null);
    this.formService.resetForCreate();
    this.isFormModalOpen.set(true);
  }

  openEditModal(player: Player): void {
    this.playerBeingEdited.set(player);
    this.formService.resetForEdit(player);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  openDeleteModal(player: Player): void {
    this.playerPendingDelete.set(player);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.playerPendingDelete.set(null);
    }
  }

  submitPlayerForm(): void {
    if (this.playerForm.invalid) {
      this.playerForm.markAllAsTouched();
      return;
    }

    const editingPlayer = this.playerBeingEdited();
    const payload = this.formService.buildPayload();
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
          parseApiErrorMessage(error),
        );
      },
    });
  }

  confirmDelete(): void {
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
        this.pushNotification('error', 'No se pudo eliminar', parseApiErrorMessage(error));
      },
    });
  }

  dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  fieldHasError(fieldName: keyof typeof this.playerForm.controls): boolean {
    return this.formService.fieldHasError(fieldName);
  }

  getFieldError(fieldName: keyof typeof this.playerForm.controls): string {
    return this.formService.getFieldError(fieldName);
  }

  getPositionLabel(position: PlayerPosition): string {
    return this.formService.getPositionLabel(position);
  }

  canSubmitForm(): boolean {
    return !this.isSaving() && !this.isTeamsLoading() && this.teams().length > 0;
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
