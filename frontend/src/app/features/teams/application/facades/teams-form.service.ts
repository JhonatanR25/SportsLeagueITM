import { computed, inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Team } from '../../domain/models/team.model';
import { TeamUpsertPayload } from '../../domain/models/team-upsert.model';

@Injectable()
export class TeamsFormService {
  private readonly formBuilder = inject(FormBuilder);

  readonly teamForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    stadium: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    logoUrl: ['', [Validators.maxLength(500)]],
    foundedDate: ['', [Validators.required]],
  });

  readonly logoPreview = computed(() => {
    const logoUrl = this.teamForm.controls.logoUrl.value.trim();
    const teamName = this.teamForm.controls.name.value.trim();

    return {
      logoUrl,
      initials: (teamName || 'EQ').slice(0, 2).toUpperCase(),
    };
  });

  resetForCreate(): void {
    this.teamForm.reset({
      name: '',
      city: '',
      stadium: '',
      logoUrl: '',
      foundedDate: '',
    });
    this.resetInteractionState();
  }

  resetForEdit(team: Team): void {
    this.teamForm.reset({
      name: team.name,
      city: team.city,
      stadium: team.stadium,
      logoUrl: team.logoUrl ?? '',
      foundedDate: this.toDateInputValue(team.foundedDate),
    });
    this.resetInteractionState();
  }

  fieldHasError(fieldName: keyof typeof this.teamForm.controls): boolean {
    const control = this.teamForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.teamForm.controls): string {
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

  buildPayload(): TeamUpsertPayload {
    const { name, city, stadium, logoUrl, foundedDate } = this.teamForm.getRawValue();

    return {
      name: name.trim(),
      city: city.trim(),
      stadium: stadium.trim(),
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
      foundedDate,
    };
  }

  private resetInteractionState(): void {
    this.teamForm.markAsPristine();
    this.teamForm.markAsUntouched();
  }

  private toDateInputValue(value: string): string {
    return value ? value.slice(0, 10) : '';
  }
}
