import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ToastNotification,
  ToastType,
} from '../../../../shared/domain/models/toast-notification.model';
import { parseApiErrorMessage } from '../../../../shared/utils/http-error.utils';
import { pushToastNotification } from '../../../../shared/utils/toast.utils';
import { Tournament } from '../../../tournaments/domain/models/tournament.model';
import { TournamentApiService } from '../../../tournaments/infrastructure/repositories/tournament-api.service';
import { SponsorCategory } from '../../domain/models/sponsor-category.type';
import { Sponsor } from '../../domain/models/sponsor.model';
import { TournamentSponsor } from '../../domain/models/tournament-sponsor.model';
import { SponsorApiService } from '../../infrastructure/repositories/sponsor-api.service';
import { SponsorsFormService } from './sponsors-form.service';

@Injectable()
export class SponsorsPageFacade {
  private readonly sponsorApi = inject(SponsorApiService);
  private readonly tournamentApi = inject(TournamentApiService);
  private readonly formService = inject(SponsorsFormService);

  readonly sponsors = signal<Sponsor[]>([]);
  readonly tournaments = signal<Tournament[]>([]);
  readonly selectedSponsorTournaments = signal<TournamentSponsor[]>([]);
  readonly isLoading = signal(true);
  readonly isTournamentsLoading = signal(true);
  readonly isSponsorTournamentsLoading = signal(false);
  readonly errorMessage = signal('');
  readonly isFormModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isManageTournamentsModalOpen = signal(false);
  readonly isSaving = signal(false);
  readonly sponsorBeingEdited = signal<Sponsor | null>(null);
  readonly sponsorPendingDelete = signal<Sponsor | null>(null);
  readonly sponsorForTournamentManagement = signal<Sponsor | null>(null);
  readonly notifications = signal<ToastNotification[]>([]);
  readonly searchTerm = signal('');
  readonly sponsorForm = this.formService.sponsorForm;
  readonly linkTournamentForm = this.formService.linkTournamentForm;
  readonly filteredSponsors = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.sponsors();
    }

    return this.sponsors().filter((sponsor) =>
      [sponsor.name, sponsor.contactEmail, sponsor.category, sponsor.phone ?? '', sponsor.websiteUrl ?? '']
        .some((value) => value.toLowerCase().includes(term)),
    );
  });
  readonly selectedSponsorCount = computed(() => this.selectedSponsorTournaments().length);
  readonly totalContractAmount = computed(() =>
    this.selectedSponsorTournaments().reduce((sum, item) => sum + item.contractAmount, 0),
  );
  readonly submitLabel = computed(() =>
    this.sponsorBeingEdited() ? 'Guardar cambios' : 'Crear sponsor',
  );
  readonly modalTitle = computed(() =>
    this.sponsorBeingEdited() ? 'Editar sponsor' : 'Crear sponsor',
  );
  readonly formModeLabel = computed(() =>
    this.sponsorBeingEdited() ? 'Edicion de sponsor' : 'Creacion de sponsor',
  );
  readonly sponsorPreview = this.formService.sponsorPreview;
  readonly availableTournaments = computed(() => {
    const selectedIds = new Set(this.selectedSponsorTournaments().map((item) => item.tournamentId));
    return this.tournaments().filter((tournament) => !selectedIds.has(tournament.id));
  });
  readonly canSubmitForm = computed(() => !this.isSaving());
  readonly canLinkTournament = computed(
    () => !this.isSaving() && !this.isTournamentsLoading() && this.availableTournaments().length > 0,
  );

  loadInitialData(): void {
    this.loadSponsors();
    this.loadTournaments();
  }

  retry(): void {
    this.loadSponsors();
    this.loadTournaments();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.sponsorBeingEdited.set(null);
    this.formService.resetForCreate();
    this.isFormModalOpen.set(true);
  }

  openEditModal(sponsor: Sponsor): void {
    this.sponsorBeingEdited.set(sponsor);
    this.formService.resetForEdit(sponsor);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    if (!this.isSaving()) {
      this.isFormModalOpen.set(false);
    }
  }

  openDeleteModal(sponsor: Sponsor): void {
    this.sponsorPendingDelete.set(sponsor);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (!this.isSaving()) {
      this.isDeleteModalOpen.set(false);
      this.sponsorPendingDelete.set(null);
    }
  }

  openManageTournamentsModal(sponsor: Sponsor): void {
    this.sponsorForTournamentManagement.set(sponsor);
    this.formService.resetLinkTournamentForm();
    this.isManageTournamentsModalOpen.set(true);
    this.loadSponsorTournaments(sponsor.id);
  }

  closeManageTournamentsModal(): void {
    if (!this.isSaving()) {
      this.isManageTournamentsModalOpen.set(false);
      this.sponsorForTournamentManagement.set(null);
      this.selectedSponsorTournaments.set([]);
      this.formService.resetLinkTournamentForm();
    }
  }

  submitSponsorForm(): void {
    if (this.sponsorForm.invalid) {
      this.sponsorForm.markAllAsTouched();
      return;
    }

    const editingSponsor = this.sponsorBeingEdited();
    const payload = this.formService.buildPayload();
    const request$: Observable<unknown> = editingSponsor
      ? this.sponsorApi.update(editingSponsor.id, payload)
      : this.sponsorApi.create(payload);

    this.isSaving.set(true);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isFormModalOpen.set(false);
        this.pushNotification(
          'success',
          editingSponsor ? 'Sponsor actualizado' : 'Sponsor creado',
          editingSponsor
            ? 'Los cambios del sponsor se guardaron correctamente.'
            : 'El nuevo sponsor se registro correctamente.',
        );
        this.loadSponsors();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          editingSponsor ? 'No se pudo actualizar' : 'No se pudo crear',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  confirmDelete(): void {
    const sponsor = this.sponsorPendingDelete();

    if (!sponsor) {
      return;
    }

    this.isSaving.set(true);

    this.sponsorApi.delete(sponsor.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isDeleteModalOpen.set(false);
        this.sponsorPendingDelete.set(null);
        this.pushNotification(
          'success',
          'Sponsor eliminado',
          `El sponsor "${sponsor.name}" fue eliminado correctamente.`,
        );
        this.loadSponsors();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification('error', 'No se pudo eliminar', parseApiErrorMessage(error));
      },
    });
  }

  linkSelectedTournament(): void {
    const sponsor = this.sponsorForTournamentManagement();

    if (!sponsor) {
      return;
    }

    if (this.linkTournamentForm.invalid) {
      this.linkTournamentForm.markAllAsTouched();
      return;
    }

    const { tournamentId, contractAmount } = this.formService.buildLinkTournamentPayload();
    this.isSaving.set(true);

    this.sponsorApi.linkTournament(sponsor.id, tournamentId, contractAmount).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.formService.resetLinkTournamentForm();
        this.pushNotification(
          'success',
          'Torneo vinculado',
          'El sponsor fue vinculado al torneo correctamente.',
        );
        this.loadSponsorTournaments(sponsor.id);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          'No se pudo vincular el torneo',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  unlinkTournament(item: TournamentSponsor): void {
    const sponsor = this.sponsorForTournamentManagement();

    if (!sponsor) {
      return;
    }

    this.isSaving.set(true);

    this.sponsorApi.unlinkTournament(sponsor.id, item.tournamentId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.pushNotification(
          'success',
          'Vinculo eliminado',
          `El torneo "${item.tournamentName}" fue desvinculado del sponsor.`,
        );
        this.loadSponsorTournaments(sponsor.id);
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.pushNotification(
          'error',
          'No se pudo eliminar el vinculo',
          parseApiErrorMessage(error),
        );
      },
    });
  }

  dismissNotification(notificationId: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== notificationId));
  }

  fieldHasError(fieldName: keyof typeof this.sponsorForm.controls): boolean {
    return this.formService.fieldHasError(fieldName);
  }

  getFieldError(fieldName: keyof typeof this.sponsorForm.controls): string {
    return this.formService.getFieldError(fieldName);
  }

  linkFieldHasError(fieldName: keyof typeof this.linkTournamentForm.controls): boolean {
    return this.formService.linkFieldHasError(fieldName);
  }

  getLinkFieldError(fieldName: keyof typeof this.linkTournamentForm.controls): string {
    return this.formService.getLinkFieldError(fieldName);
  }

  getCategoryLabel(category: SponsorCategory): string {
    switch (category) {
      case 'Main':
        return 'Principal';
      case 'Gold':
        return 'Gold';
      case 'Silver':
        return 'Silver';
      case 'Bronze':
        return 'Bronze';
    }
  }

  private loadSponsors(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.sponsorApi.getAll().subscribe({
      next: (sponsors) => {
        this.sponsors.set(sponsors);
        this.searchTerm.set('');
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(parseApiErrorMessage(error));
        this.isLoading.set(false);
      },
    });
  }

  private loadTournaments(): void {
    this.isTournamentsLoading.set(true);

    this.tournamentApi.getAll().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.isTournamentsLoading.set(false);
      },
      error: () => {
        this.isTournamentsLoading.set(false);
      },
    });
  }

  private loadSponsorTournaments(sponsorId: number): void {
    this.isSponsorTournamentsLoading.set(true);
    this.selectedSponsorTournaments.set([]);

    this.sponsorApi.getTournaments(sponsorId).subscribe({
      next: (items) => {
        this.selectedSponsorTournaments.set(items);
        this.isSponsorTournamentsLoading.set(false);
      },
      error: () => {
        this.isSponsorTournamentsLoading.set(false);
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
