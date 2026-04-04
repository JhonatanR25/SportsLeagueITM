import { computed, inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { toSponsorCategoryCode } from '../../domain/models/sponsor-category.utils';
import { SponsorCategory } from '../../domain/models/sponsor-category.type';
import { Sponsor } from '../../domain/models/sponsor.model';
import { SponsorUpsertPayload } from '../../domain/models/sponsor-upsert.model';

@Injectable()
export class SponsorsFormService {
  private readonly formBuilder = inject(FormBuilder);

  readonly sponsorForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    websiteUrl: ['', [Validators.maxLength(500)]],
    category: ['Bronze' as SponsorCategory, [Validators.required]],
  });

  readonly linkTournamentForm = this.formBuilder.nonNullable.group({
    tournamentId: [0, [Validators.required, Validators.min(1)]],
    contractAmount: [0, [Validators.required, Validators.min(0.01)]],
  });

  readonly sponsorPreview = computed(() => {
    const name = this.sponsorForm.controls.name.value.trim();
    const contactEmail = this.sponsorForm.controls.contactEmail.value.trim();
    const websiteUrl = this.sponsorForm.controls.websiteUrl.value.trim();
    const category = this.sponsorForm.controls.category.value;

    return {
      initials: name.slice(0, 2).toUpperCase() || 'SP',
      name: name || 'Nombre del sponsor',
      contactEmail: contactEmail || 'correo@empresa.com',
      websiteUrl: websiteUrl || 'Sitio web pendiente',
      category,
    };
  });

  resetForCreate(): void {
    this.sponsorForm.reset({
      name: '',
      contactEmail: '',
      phone: '',
      websiteUrl: '',
      category: 'Bronze',
    });
    this.resetSponsorInteractionState();
  }

  resetForEdit(sponsor: Sponsor): void {
    this.sponsorForm.reset({
      name: sponsor.name,
      contactEmail: sponsor.contactEmail,
      phone: sponsor.phone ?? '',
      websiteUrl: sponsor.websiteUrl ?? '',
      category: sponsor.category,
    });
    this.resetSponsorInteractionState();
  }

  resetLinkTournamentForm(): void {
    this.linkTournamentForm.reset({
      tournamentId: 0,
      contractAmount: 0,
    });
    this.resetLinkInteractionState();
  }

  fieldHasError(fieldName: keyof typeof this.sponsorForm.controls): boolean {
    const control = this.sponsorForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getFieldError(fieldName: keyof typeof this.sponsorForm.controls): string {
    const control = this.sponsorForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo valido.';
    }

    if (control.hasError('minlength')) {
      return 'El valor es demasiado corto.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor supera la longitud permitida.';
    }

    return 'Revisa este campo.';
  }

  linkFieldHasError(fieldName: keyof typeof this.linkTournamentForm.controls): boolean {
    const control = this.linkTournamentForm.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  getLinkFieldError(fieldName: keyof typeof this.linkTournamentForm.controls): string {
    const control = this.linkTournamentForm.controls[fieldName];

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (fieldName === 'tournamentId' && control.hasError('min')) {
      return 'Selecciona un torneo valido.';
    }

    if (fieldName === 'contractAmount' && control.hasError('min')) {
      return 'El monto debe ser mayor a cero.';
    }

    return 'Revisa este campo.';
  }

  buildPayload(): SponsorUpsertPayload {
    const { name, contactEmail, phone, websiteUrl, category } = this.sponsorForm.getRawValue();

    return {
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      phone: phone.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      category: toSponsorCategoryCode(category),
    };
  }

  buildLinkTournamentPayload(): { tournamentId: number; contractAmount: number } {
    const { tournamentId, contractAmount } = this.linkTournamentForm.getRawValue();

    return {
      tournamentId,
      contractAmount,
    };
  }

  private resetSponsorInteractionState(): void {
    this.sponsorForm.markAsPristine();
    this.sponsorForm.markAsUntouched();
  }

  private resetLinkInteractionState(): void {
    this.linkTournamentForm.markAsPristine();
    this.linkTournamentForm.markAsUntouched();
  }
}
