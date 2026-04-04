import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';

import { AutoRefreshService } from '../../../../shared/application/auto-refresh.service';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ContextBannerComponent } from '../../../../shared/presentation/components/context-banner/context-banner.component';
import { ContextBannerItemComponent } from '../../../../shared/presentation/components/context-banner-item/context-banner-item.component';
import { ModulePageHeaderComponent } from '../../../../shared/presentation/components/module-page-header/module-page-header.component';
import { SectionCardHeaderComponent } from '../../../../shared/presentation/components/section-card-header/section-card-header.component';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { SponsorsFormService } from '../../application/facades/sponsors-form.service';
import { SponsorsPageFacade } from '../../application/facades/sponsors-page.facade';
import { Sponsor } from '../../domain/models/sponsor.model';
import { TournamentSponsor } from '../../domain/models/tournament-sponsor.model';

@Component({
  selector: 'app-sponsors-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    ContextBannerComponent,
    ContextBannerItemComponent,
    ModulePageHeaderComponent,
    SectionCardHeaderComponent,
    StateCardComponent,
    ToastStackComponent,
  ],
  templateUrl: './sponsors-page.component.html',
  styleUrl: './sponsors-page.component.scss',
  providers: [SponsorsFormService, SponsorsPageFacade],
})
export class SponsorsPageComponent {
  private readonly facade = inject(SponsorsPageFacade);
  private readonly autoRefresh = inject(AutoRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sponsorForm = this.facade.sponsorForm;
  protected readonly linkTournamentForm = this.facade.linkTournamentForm;
  protected readonly sponsors = this.facade.sponsors;
  protected readonly selectedSponsorTournaments = this.facade.selectedSponsorTournaments;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isTournamentsLoading = this.facade.isTournamentsLoading;
  protected readonly isSponsorTournamentsLoading = this.facade.isSponsorTournamentsLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isFormModalOpen = this.facade.isFormModalOpen;
  protected readonly isDeleteModalOpen = this.facade.isDeleteModalOpen;
  protected readonly isManageTournamentsModalOpen = this.facade.isManageTournamentsModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly sponsorPendingDelete = this.facade.sponsorPendingDelete;
  protected readonly sponsorForTournamentManagement = this.facade.sponsorForTournamentManagement;
  protected readonly notifications = this.facade.notifications;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly filteredSponsors = this.facade.filteredSponsors;
  protected readonly submitLabel = this.facade.submitLabel;
  protected readonly modalTitle = this.facade.modalTitle;
  protected readonly formModeLabel = this.facade.formModeLabel;
  protected readonly sponsorPreview = this.facade.sponsorPreview;
  protected readonly availableTournaments = this.facade.availableTournaments;
  protected readonly selectedSponsorCount = this.facade.selectedSponsorCount;
  protected readonly totalContractAmount = this.facade.totalContractAmount;
  protected readonly canSubmitForm = this.facade.canSubmitForm;
  protected readonly canLinkTournament = this.facade.canLinkTournament;

  constructor() {
    this.facade.loadInitialData();
    this.autoRefresh
      .watch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.retry());
  }

  protected trackBySponsorId(_: number, sponsor: Sponsor): number {
    return sponsor.id;
  }

  protected trackByTournamentSponsorId(_: number, item: TournamentSponsor): number {
    return item.id;
  }

  protected retry(): void {
    this.facade.retry();
  }

  protected updateSearchTerm(value: string): void {
    this.facade.updateSearchTerm(value);
  }

  protected openCreateModal(): void {
    this.facade.openCreateModal();
  }

  protected openEditModal(sponsor: Sponsor): void {
    this.facade.openEditModal(sponsor);
  }

  protected closeFormModal(): void {
    this.facade.closeFormModal();
  }

  protected openDeleteModal(sponsor: Sponsor): void {
    this.facade.openDeleteModal(sponsor);
  }

  protected closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  protected openManageTournamentsModal(sponsor: Sponsor): void {
    this.facade.openManageTournamentsModal(sponsor);
  }

  protected closeManageTournamentsModal(): void {
    this.facade.closeManageTournamentsModal();
  }

  protected submitSponsorForm(): void {
    this.facade.submitSponsorForm();
  }

  protected confirmDelete(): void {
    this.facade.confirmDelete();
  }

  protected linkSelectedTournament(): void {
    this.facade.linkSelectedTournament();
  }

  protected unlinkTournament(item: TournamentSponsor): void {
    this.facade.unlinkTournament(item);
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected fieldHasError(fieldName: keyof typeof this.sponsorForm.controls): boolean {
    return this.facade.fieldHasError(fieldName);
  }

  protected getFieldError(fieldName: keyof typeof this.sponsorForm.controls): string {
    return this.facade.getFieldError(fieldName);
  }

  protected linkFieldHasError(fieldName: keyof typeof this.linkTournamentForm.controls): boolean {
    return this.facade.linkFieldHasError(fieldName);
  }

  protected getLinkFieldError(fieldName: keyof typeof this.linkTournamentForm.controls): string {
    return this.facade.getLinkFieldError(fieldName);
  }

  protected getCategoryLabel(category: Sponsor['category']): string {
    return this.facade.getCategoryLabel(category);
  }
}
