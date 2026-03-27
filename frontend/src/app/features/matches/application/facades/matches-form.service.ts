import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Match } from '../../domain/models/match.model';
import { MatchCreatePayload } from '../../domain/models/match-create.model';

@Injectable()
export class MatchesFormService {
  private readonly formBuilder = inject(FormBuilder);

  readonly createForm = this.formBuilder.nonNullable.group({
    matchDate: ['', [Validators.required]],
    tournamentId: [0, [Validators.required, Validators.min(1)]],
    homeTeamId: [0, [Validators.required, Validators.min(1)]],
    awayTeamId: [0, [Validators.required, Validators.min(1)]],
    refereeId: [0, [Validators.required, Validators.min(1)]],
  });

  readonly scoreForm = this.formBuilder.nonNullable.group({
    homeScore: [0, [Validators.required, Validators.min(0)]],
    awayScore: [0, [Validators.required, Validators.min(0)]],
    isFinalScore: [false],
  });

  resetCreateForm(): void {
    this.createForm.reset({
      matchDate: '',
      tournamentId: 0,
      homeTeamId: 0,
      awayTeamId: 0,
      refereeId: 0,
    });
    this.resetCreateInteractionState();
  }

  resetScoreForm(match: Match): void {
    this.scoreForm.reset({
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isFinalScore: match.status === 'Finished',
    });
  }

  hasCreateFieldError(fieldName: keyof typeof this.createForm.controls): boolean {
    const control = this.createForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  getCreateFieldError(fieldName: keyof typeof this.createForm.controls): string {
    const control = this.createForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'Selecciona una opcion valida.';
    }

    return 'Revisa este campo.';
  }

  hasScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): boolean {
    const control = this.scoreForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  getScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): string {
    const control = this.scoreForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'El marcador no puede ser negativo.';
    }

    return 'Revisa este campo.';
  }

  buildCreatePayload(): MatchCreatePayload {
    return this.createForm.getRawValue() as MatchCreatePayload;
  }

  private resetCreateInteractionState(): void {
    this.createForm.markAsPristine();
    this.createForm.markAsUntouched();
  }
}
