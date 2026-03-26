import { computed, inject, Injectable, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ToastNotification, ToastType } from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Team } from '../../../teams/domain/models/team.model';
import { TeamApiService } from '../../../teams/infrastructure/repositories/team-api.service';
import { Player } from '../../domain/models/player.model';
import { PlayerPosition } from '../../domain/models/player-position.type';
import { PlayerUpsertPayload } from '../../domain/models/player-upsert.model';
import { PlayerApiService } from '../../infrastructure/repositories/player-api.service';

type PositionOption = {
  value: PlayerPosition;
  label: string;
};

@Injectable()
export class PlayersPageFacade {
  private readonly playerApi = inject(PlayerApiService);
  private readonly teamApi = inject(TeamApiService);
  private readonly formBuilder = inject(FormBuilder);

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
  readonly uniqueTeamsCount = computed(
    () => new Set(this.filteredPlayers().map((player) => player.teamName.trim().toLowerCase())).size,
  );
  readonly submitLabel = computed(() =>
    this.playerBeingEdited() ? 'Guardar cambios' : 'Crear jugador',
  );
  readonly modalTitle = computed(() =>
    this.playerBeingEdited() ? 'Editar jugador' : 'Crear jugador',
  );
  readonly formModeLabel = computed(() =>
    this.playerBeingEdited() ? 'Edicion de jugador' : 'Creacion de jugador',
  );
  readonly playerPreview = computed(() => {
    const firstName = this.playerForm.controls.firstName.value.trim();
    const lastName = this.playerForm.controls.lastName.value.trim();
    const team = this.teams().find((item) => item.id === this.playerForm.controls.teamId.value);

    return {
      initials: `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.trim().toUpperCase() || 'JG',
      fullName: `${firstName} ${lastName}`.trim() || 'Nombre del jugador',
      teamName: team?.name ?? 'Sin equipo seleccionado',
      positionLabel: this.getPositionLabel(this.playerForm.controls.position.value),
    };
  });
  readonly positionOptions: PositionOption[] = [
    { value: 'Goalkeeper', label: 'Portero' },
    { value: 'Defender', label: 'Defensa' },
    { value: 'Midfielder', label: 'Mediocampista' },
    { value: 'Forward', label: 'Delantero' },
  ];
  readonly playerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    birthDate: ['', [Validators.required]],
    number: [0, [Validators.required, Validators.min(1), Validators.max(999)]],
    position: ['Goalkeeper' as PlayerPosition, [Validators.required]],
    teamId: [0, [Validators.required, Validators.min(1)]],
  });

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

  openEditModal(player: Player): void {
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
    const control = this.playerForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.playerForm.controls): string {
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

  getPositionLabel(position: PlayerPosition): string {
    return this.positionOptions.find((option) => option.value === position)?.label ?? position;
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
    pushToastNotification(
      this.notifications,
      (notificationId) => this.dismissNotification(notificationId),
      type,
      title,
      message,
    );
  }
}
