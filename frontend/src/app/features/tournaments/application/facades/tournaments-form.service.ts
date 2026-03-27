import { computed, inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Tournament } from '../../domain/models/tournament.model';
import { TournamentUpsertPayload } from '../../domain/models/tournament-upsert.model';

@Injectable()
export class TournamentsFormService {
  private readonly formBuilder = inject(FormBuilder);

  readonly tournamentForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    season: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  readonly hasDateRangeError = computed(() => {
    const { startDate, endDate } = this.tournamentForm.getRawValue();

    if (!startDate || !endDate) {
      return false;
    }

    return new Date(endDate).getTime() <= new Date(startDate).getTime();
  });

  resetForCreate(): void {
    this.tournamentForm.reset({ name: '', season: '', startDate: '', endDate: '' });
    this.resetInteractionState();
  }

  resetForEdit(tournament: Tournament): void {
    this.tournamentForm.reset({
      name: tournament.name,
      season: tournament.season,
      startDate: this.toDateInputValue(tournament.startDate),
      endDate: this.toDateInputValue(tournament.endDate),
    });
    this.resetInteractionState();
  }

  fieldHasError(fieldName: keyof typeof this.tournamentForm.controls): boolean {
    const control = this.tournamentForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.tournamentForm.controls): string {
    const control = this.tournamentForm.controls[fieldName];

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

  buildPayload(): TournamentUpsertPayload {
    const { name, season, startDate, endDate } = this.tournamentForm.getRawValue();

    return {
      name: name.trim(),
      season: season.trim(),
      startDate,
      endDate,
    };
  }

  private resetInteractionState(): void {
    this.tournamentForm.markAsPristine();
    this.tournamentForm.markAsUntouched();
  }

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
  }
}
