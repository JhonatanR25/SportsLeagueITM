import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';

import { AutoRefreshService } from '../../../../shared/application/auto-refresh.service';
import { ContextBannerComponent } from '../../../../shared/presentation/components/context-banner/context-banner.component';
import { ContextBannerItemComponent } from '../../../../shared/presentation/components/context-banner-item/context-banner-item.component';
import { ModulePageHeaderComponent } from '../../../../shared/presentation/components/module-page-header/module-page-header.component';
import { SectionCardHeaderComponent } from '../../../../shared/presentation/components/section-card-header/section-card-header.component';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { MatchesFormService } from '../../application/facades/matches-form.service';
import { Match } from '../../domain/models/match.model';
import { MatchStatus } from '../../domain/models/match-status.type';
import { MatchesPageFacade } from '../../application/facades/matches-page.facade';

@Component({
  selector: 'app-matches-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ContextBannerComponent,
    ContextBannerItemComponent,
    ModulePageHeaderComponent,
    SectionCardHeaderComponent,
    StateCardComponent,
    ToastStackComponent,
  ],
  templateUrl: './matches-page.component.html',
  styleUrl: './matches-page.component.scss',
  providers: [MatchesFormService, MatchesPageFacade],
})
export class MatchesPageComponent {
  private readonly facade = inject(MatchesPageFacade);
  private readonly autoRefresh = inject(AutoRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly matches = this.facade.matches;
  protected readonly teams = this.facade.teams;
  protected readonly referees = this.facade.referees;
  protected readonly availableReferees = this.facade.availableReferees;
  protected readonly tournaments = this.facade.tournaments;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isCatalogLoading = this.facade.isCatalogLoading;
  protected readonly isTournamentTeamsLoading = this.facade.isTournamentTeamsLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isCreateModalOpen = this.facade.isCreateModalOpen;
  protected readonly isScoreModalOpen = this.facade.isScoreModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly selectedMatchForScore = this.facade.selectedMatchForScore;
  protected readonly notifications = this.facade.notifications;
  protected readonly filterStatus = this.facade.filterStatus;
  protected readonly filterTournamentId = this.facade.filterTournamentId;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly selectedCreateTournamentId = this.facade.selectedCreateTournamentId;
  protected readonly selectedHomeTeamId = this.facade.selectedHomeTeamId;
  protected readonly selectedAwayTeamId = this.facade.selectedAwayTeamId;
  protected readonly statusOptions = this.facade.statusOptions;
  protected readonly tournamentTeams = this.facade.tournamentTeams;
  protected readonly filteredMatches = this.facade.filteredMatches;
  protected readonly selectedTournament = this.facade.selectedTournament;
  protected readonly availableHomeTeams = this.facade.availableHomeTeams;
  protected readonly availableAwayTeams = this.facade.availableAwayTeams;
  protected readonly canCreateMatch = this.facade.canCreateMatch;
  protected readonly createForm = this.facade.createForm;
  protected readonly scoreForm = this.facade.scoreForm;

  constructor() {
    this.facade.loadInitialData();
    this.autoRefresh
      .watch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.retry());
  }

  protected trackByMatchId(_: number, match: Match): number {
    return match.id;
  }

  protected retry(): void {
    this.facade.retry();
  }

  protected updateSearchTerm(value: string): void {
    this.facade.updateSearchTerm(value);
  }

  protected updateFilterStatus(value: MatchStatus | ''): void {
    this.facade.updateFilterStatus(value);
  }

  protected updateFilterTournament(value: number): void {
    this.facade.updateFilterTournament(value);
  }

  protected openCreateModal(): void {
    this.facade.openCreateModal();
  }

  protected closeCreateModal(): void {
    this.facade.closeCreateModal();
  }

  protected openScoreModal(match: Match): void {
    this.facade.openScoreModal(match);
  }

  protected closeScoreModal(): void {
    this.facade.closeScoreModal();
  }

  protected submitCreateForm(): void {
    this.facade.submitCreateForm();
  }

  protected submitScoreForm(): void {
    this.facade.submitScoreForm();
  }

  protected updateMatchStatus(match: Match, status: MatchStatus): void {
    this.facade.updateMatchStatus(match, status);
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected getStatusLabel(status: MatchStatus): string {
    return this.facade.getStatusLabel(status);
  }

  protected getStatusActionLabel(currentStatus: MatchStatus, nextStatus: MatchStatus): string {
    return this.facade.getStatusActionLabel(currentStatus, nextStatus);
  }

  protected getNextStatusOptions(match: Match): MatchStatus[] {
    return this.facade.getNextStatusOptions(match);
  }

  protected canEditScore(match: Match): boolean {
    return this.facade.canEditScore(match);
  }

  protected canMarkAsFinal(match: Match): boolean {
    return this.facade.canMarkAsFinal(match);
  }

  protected hasCreateFieldError(fieldName: keyof typeof this.createForm.controls): boolean {
    return this.facade.hasCreateFieldError(fieldName);
  }

  protected getCreateFieldError(fieldName: keyof typeof this.createForm.controls): string {
    return this.facade.getCreateFieldError(fieldName);
  }

  protected hasScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): boolean {
    return this.facade.hasScoreFieldError(fieldName);
  }

  protected getScoreFieldError(fieldName: keyof typeof this.scoreForm.controls): string {
    return this.facade.getScoreFieldError(fieldName);
  }
}
