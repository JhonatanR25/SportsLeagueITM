import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ContextBannerComponent } from '../../../../shared/presentation/components/context-banner/context-banner.component';
import { ContextBannerItemComponent } from '../../../../shared/presentation/components/context-banner-item/context-banner-item.component';
import { ModulePageHeaderComponent } from '../../../../shared/presentation/components/module-page-header/module-page-header.component';
import { SectionCardHeaderComponent } from '../../../../shared/presentation/components/section-card-header/section-card-header.component';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { Tournament } from '../../domain/models/tournament.model';
import { TournamentStatus } from '../../domain/models/tournament-status.type';
import { TournamentsPageFacade } from '../../application/facades/tournaments-page.facade';

@Component({
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, ConfirmDialogComponent, ContextBannerComponent, ContextBannerItemComponent, ModulePageHeaderComponent, SectionCardHeaderComponent, StateCardComponent, ToastStackComponent],
  templateUrl: './tournaments-page.component.html',
  styleUrl: './tournaments-page.component.scss',
  providers: [TournamentsPageFacade],
})
export class TournamentsPageComponent {
  private readonly facade = inject(TournamentsPageFacade);

  protected readonly tournamentForm = this.facade.tournamentForm;
  protected readonly tournaments = this.facade.tournaments;
  protected readonly teams = this.facade.teams;
  protected readonly selectedTournamentTeams = this.facade.selectedTournamentTeams;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isTeamsLoading = this.facade.isTeamsLoading;
  protected readonly isTournamentTeamsLoading = this.facade.isTournamentTeamsLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isFormModalOpen = this.facade.isFormModalOpen;
  protected readonly isDeleteModalOpen = this.facade.isDeleteModalOpen;
  protected readonly isRegisterTeamsModalOpen = this.facade.isRegisterTeamsModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly tournamentBeingEdited = this.facade.tournamentBeingEdited;
  protected readonly tournamentPendingDelete = this.facade.tournamentPendingDelete;
  protected readonly tournamentForRegistration = this.facade.tournamentForRegistration;
  protected readonly notifications = this.facade.notifications;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly selectedTeamId = this.facade.selectedTeamId;
  protected readonly filteredTournaments = this.facade.filteredTournaments;
  protected readonly submitLabel = this.facade.submitLabel;
  protected readonly modalTitle = this.facade.modalTitle;
  protected readonly formModeLabel = this.facade.formModeLabel;
  protected readonly selectedTournamentStatusCopy = this.facade.selectedTournamentStatusCopy;
  protected readonly availableTeamsForRegistration = this.facade.availableTeamsForRegistration;
  protected readonly remainingTeamsCount = this.facade.remainingTeamsCount;
  protected readonly canSubmitTournamentForm = this.facade.canSubmitTournamentForm;
  protected readonly canRegisterSelectedTeam = this.facade.canRegisterSelectedTeam;

  constructor() {
    this.facade.loadInitialData();
  }

  protected trackByTournamentId(_: number, tournament: Tournament): number {
    return tournament.id;
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

  protected openEditModal(tournament: Tournament): void {
    this.facade.openEditModal(tournament);
  }

  protected closeFormModal(): void {
    this.facade.closeFormModal();
  }

  protected openDeleteModal(tournament: Tournament): void {
    this.facade.openDeleteModal(tournament);
  }

  protected closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  protected openRegisterTeamsModal(tournament: Tournament): void {
    this.facade.openRegisterTeamsModal(tournament);
  }

  protected closeRegisterTeamsModal(): void {
    this.facade.closeRegisterTeamsModal();
  }

  protected updateSelectedTeamId(value: number): void {
    this.facade.updateSelectedTeamId(value);
  }

  protected submitTournamentForm(): void {
    this.facade.submitTournamentForm();
  }

  protected confirmDelete(): void {
    this.facade.confirmDelete();
  }

  protected advanceStatus(tournament: Tournament): void {
    this.facade.advanceStatus(tournament);
  }

  protected registerSelectedTeam(): void {
    this.facade.registerSelectedTeam();
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected fieldHasError(fieldName: keyof typeof this.tournamentForm.controls): boolean {
    return this.facade.fieldHasError(fieldName);
  }

  protected getFieldError(fieldName: keyof typeof this.tournamentForm.controls): string {
    return this.facade.getFieldError(fieldName);
  }

  protected hasDateRangeError(): boolean {
    return this.facade.hasDateRangeError();
  }

  protected canEdit(tournament: Tournament): boolean {
    return this.facade.canEdit(tournament);
  }

  protected canDelete(tournament: Tournament): boolean {
    return this.facade.canDelete(tournament);
  }

  protected canRegisterTeams(tournament: Tournament): boolean {
    return this.facade.canRegisterTeams(tournament);
  }

  protected canAdvanceStatus(tournament: Tournament): boolean {
    return this.facade.canAdvanceStatus(tournament);
  }

  protected getStatusLabel(status: TournamentStatus): string {
    return this.facade.getStatusLabel(status);
  }

  protected getStatusActionLabel(status: TournamentStatus): string {
    return this.facade.getStatusActionLabel(status);
  }
}
