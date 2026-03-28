import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';

import { AutoRefreshService } from '../../../../shared/application/auto-refresh.service';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ModulePageHeaderComponent } from '../../../../shared/presentation/components/module-page-header/module-page-header.component';
import { SectionCardHeaderComponent } from '../../../../shared/presentation/components/section-card-header/section-card-header.component';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { Team } from '../../domain/models/team.model';
import { TeamsPageFacade } from '../../application/facades/teams-page.facade';
import { TeamsFormService } from '../../application/facades/teams-form.service';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    ModulePageHeaderComponent,
    SectionCardHeaderComponent,
    StateCardComponent,
    ToastStackComponent,
  ],
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
  providers: [TeamsFormService, TeamsPageFacade],
})
export class TeamsPageComponent {
  private readonly facade = inject(TeamsPageFacade);
  private readonly autoRefresh = inject(AutoRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly teamForm = this.facade.teamForm;
  protected readonly teams = this.facade.teams;
  protected readonly filteredTeams = this.facade.filteredTeams;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isFormModalOpen = this.facade.isFormModalOpen;
  protected readonly isDeleteModalOpen = this.facade.isDeleteModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly teamBeingEdited = this.facade.teamBeingEdited;
  protected readonly teamPendingDelete = this.facade.teamPendingDelete;
  protected readonly notifications = this.facade.notifications;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly submitLabel = this.facade.submitLabel;
  protected readonly modalTitle = this.facade.modalTitle;
  protected readonly formModeLabel = this.facade.formModeLabel;
  protected readonly logoPreview = this.facade.logoPreview;

  constructor() {
    this.facade.loadTeams();
    this.autoRefresh
      .watch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.retry());
  }

  protected trackByTeamId(_: number, team: Team): number {
    return team.id;
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

  protected openEditModal(team: Team): void {
    this.facade.openEditModal(team);
  }

  protected closeFormModal(): void {
    this.facade.closeFormModal();
  }

  protected openDeleteModal(team: Team): void {
    this.facade.openDeleteModal(team);
  }

  protected closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  protected submitTeamForm(): void {
    this.facade.submitTeamForm();
  }

  protected confirmDelete(): void {
    this.facade.confirmDelete();
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected fieldHasError(fieldName: keyof typeof this.teamForm.controls): boolean {
    return this.facade.fieldHasError(fieldName);
  }

  protected getFieldError(fieldName: keyof typeof this.teamForm.controls): string {
    return this.facade.getFieldError(fieldName);
  }

  protected canSubmitForm(): boolean {
    return this.facade.canSubmitForm();
  }
}
