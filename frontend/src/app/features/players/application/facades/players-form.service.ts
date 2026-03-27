import { computed, inject, Injectable, Signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Team } from '../../../teams/domain/models/team.model';
import { Player } from '../../domain/models/player.model';
import { PlayerPosition } from '../../domain/models/player-position.type';
import { PlayerUpsertPayload } from '../../domain/models/player-upsert.model';

type PositionOption = {
  value: PlayerPosition;
  label: string;
};

@Injectable()
export class PlayersFormService {
  private readonly formBuilder = inject(FormBuilder);

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

  createPreview(teams: Signal<Team[]>) {
    return computed(() => {
      const firstName = this.playerForm.controls.firstName.value.trim();
      const lastName = this.playerForm.controls.lastName.value.trim();
      const team = teams().find((item) => item.id === this.playerForm.controls.teamId.value);

      return {
        initials: `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.trim().toUpperCase() || 'JG',
        fullName: `${firstName} ${lastName}`.trim() || 'Nombre del jugador',
        teamName: team?.name ?? 'Sin equipo seleccionado',
        positionLabel: this.getPositionLabel(this.playerForm.controls.position.value),
      };
    });
  }

  resetForCreate(): void {
    this.playerForm.reset({
      firstName: '',
      lastName: '',
      birthDate: '',
      number: 0,
      position: 'Goalkeeper',
      teamId: 0,
    });
    this.resetInteractionState();
  }

  resetForEdit(player: Player): void {
    this.playerForm.reset({
      firstName: player.firstName,
      lastName: player.lastName,
      birthDate: this.toDateInputValue(player.birthDate),
      number: player.number,
      position: player.position,
      teamId: player.teamId,
    });
    this.resetInteractionState();
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

  buildPayload(): PlayerUpsertPayload {
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

  private resetInteractionState(): void {
    this.playerForm.markAsPristine();
    this.playerForm.markAsUntouched();
  }

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
  }
}
