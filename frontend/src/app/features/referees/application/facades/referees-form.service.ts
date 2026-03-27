import { computed, inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Referee } from '../../domain/models/referee.model';
import { RefereeUpsertPayload } from '../../domain/models/referee-upsert.model';

@Injectable()
export class RefereesFormService {
  private readonly formBuilder = inject(FormBuilder);

  readonly refereeForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    nationality: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

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

  resetForCreate(): void {
    this.refereeForm.reset({
      firstName: '',
      lastName: '',
      nationality: '',
    });
    this.resetInteractionState();
  }

  resetForEdit(referee: Referee): void {
    this.refereeForm.reset({
      firstName: referee.firstName,
      lastName: referee.lastName,
      nationality: referee.nationality,
    });
    this.resetInteractionState();
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

  buildPayload(): RefereeUpsertPayload {
    const { firstName, lastName, nationality } = this.refereeForm.getRawValue();

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality: nationality.trim(),
    };
  }

  private resetInteractionState(): void {
    this.refereeForm.markAsPristine();
    this.refereeForm.markAsUntouched();
  }
}
