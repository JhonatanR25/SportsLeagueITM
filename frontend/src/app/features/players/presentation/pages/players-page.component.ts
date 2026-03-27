import { CommonModule, DatePipe } from '@angular/common';
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
import { Player } from '../../domain/models/player.model';
import { PlayerPosition } from '../../domain/models/player-position.type';
import { PlayersFormService } from '../../application/facades/players-form.service';
import { PlayersPageFacade } from '../../application/facades/players-page.facade';

@Component({
  selector: 'app-players-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    ContextBannerComponent,
    ContextBannerItemComponent,
    ModulePageHeaderComponent,
    SectionCardHeaderComponent,
    StateCardComponent,
    ToastStackComponent,
  ],
  templateUrl: './players-page.component.html',
  styleUrl: './players-page.component.scss',
  providers: [PlayersFormService, PlayersPageFacade],
})
export class PlayersPageComponent {
  private readonly facade = inject(PlayersPageFacade);
  private readonly autoRefresh = inject(AutoRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly playerForm = this.facade.playerForm;
  protected readonly players = this.facade.players;
  protected readonly teams = this.facade.teams;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly isTeamsLoading = this.facade.isTeamsLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isFormModalOpen = this.facade.isFormModalOpen;
  protected readonly isDeleteModalOpen = this.facade.isDeleteModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly playerBeingEdited = this.facade.playerBeingEdited;
  protected readonly playerPendingDelete = this.facade.playerPendingDelete;
  protected readonly notifications = this.facade.notifications;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly filteredPlayers = this.facade.filteredPlayers;
  protected readonly submitLabel = this.facade.submitLabel;
  protected readonly modalTitle = this.facade.modalTitle;
  protected readonly formModeLabel = this.facade.formModeLabel;
  protected readonly playerPreview = this.facade.playerPreview;
  protected readonly positionOptions = this.facade.positionOptions;

  constructor() {
    this.facade.loadInitialData();
    this.autoRefresh
      .watch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.retry());
  }

  protected trackByPlayerId(_: number, player: Player): number {
    return player.id;
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

  protected openEditModal(player: Player): void {
    this.facade.openEditModal(player);
  }

  protected closeFormModal(): void {
    this.facade.closeFormModal();
  }

  protected openDeleteModal(player: Player): void {
    this.facade.openDeleteModal(player);
  }

  protected closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  protected submitPlayerForm(): void {
    this.facade.submitPlayerForm();
  }

  protected confirmDelete(): void {
    this.facade.confirmDelete();
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected fieldHasError(fieldName: keyof typeof this.playerForm.controls): boolean {
    return this.facade.fieldHasError(fieldName);
  }

  protected getFieldError(fieldName: keyof typeof this.playerForm.controls): string {
    return this.facade.getFieldError(fieldName);
  }

  protected getPositionLabel(position: PlayerPosition): string {
    return this.facade.getPositionLabel(position);
  }

  protected canSubmitForm(): boolean {
    return this.facade.canSubmitForm();
  }
}
