import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { ContextBannerComponent } from '../../../../shared/presentation/components/context-banner/context-banner.component';
import { ContextBannerItemComponent } from '../../../../shared/presentation/components/context-banner-item/context-banner-item.component';
import { ModulePageHeaderComponent } from '../../../../shared/presentation/components/module-page-header/module-page-header.component';
import { SectionCardHeaderComponent } from '../../../../shared/presentation/components/section-card-header/section-card-header.component';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { ToastStackComponent } from '../../../../shared/presentation/components/toast-stack/toast-stack.component';
import { Referee } from '../../domain/models/referee.model';
import { RefereesFormService } from '../../application/facades/referees-form.service';
import { RefereesPageFacade } from '../../application/facades/referees-page.facade';

@Component({
  selector: 'app-referees-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    ContextBannerComponent,
    ContextBannerItemComponent,
    ModulePageHeaderComponent,
    SectionCardHeaderComponent,
    StateCardComponent,
    ToastStackComponent,
  ],
  templateUrl: './referees-page.component.html',
  styleUrl: './referees-page.component.scss',
  providers: [RefereesFormService, RefereesPageFacade],
})
export class RefereesPageComponent {
  private readonly facade = inject(RefereesPageFacade);

  protected readonly refereeForm = this.facade.refereeForm;
  protected readonly referees = this.facade.referees;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly isFormModalOpen = this.facade.isFormModalOpen;
  protected readonly isDeleteModalOpen = this.facade.isDeleteModalOpen;
  protected readonly isSaving = this.facade.isSaving;
  protected readonly refereeBeingEdited = this.facade.refereeBeingEdited;
  protected readonly refereePendingDelete = this.facade.refereePendingDelete;
  protected readonly notifications = this.facade.notifications;
  protected readonly searchTerm = this.facade.searchTerm;
  protected readonly filteredReferees = this.facade.filteredReferees;
  protected readonly submitLabel = this.facade.submitLabel;
  protected readonly modalTitle = this.facade.modalTitle;
  protected readonly formModeLabel = this.facade.formModeLabel;
  protected readonly refereePreview = this.facade.refereePreview;

  constructor() {
    this.facade.loadReferees();
  }

  protected trackByRefereeId(_: number, referee: Referee): number {
    return referee.id;
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

  protected openEditModal(referee: Referee): void {
    this.facade.openEditModal(referee);
  }

  protected closeFormModal(): void {
    this.facade.closeFormModal();
  }

  protected openDeleteModal(referee: Referee): void {
    this.facade.openDeleteModal(referee);
  }

  protected closeDeleteModal(): void {
    this.facade.closeDeleteModal();
  }

  protected submitRefereeForm(): void {
    this.facade.submitRefereeForm();
  }

  protected confirmDelete(): void {
    this.facade.confirmDelete();
  }

  protected dismissNotification(notificationId: number): void {
    this.facade.dismissNotification(notificationId);
  }

  protected fieldHasError(fieldName: keyof typeof this.refereeForm.controls): boolean {
    return this.facade.fieldHasError(fieldName);
  }

  protected getFieldError(fieldName: keyof typeof this.refereeForm.controls): string {
    return this.facade.getFieldError(fieldName);
  }

  protected canSubmitForm(): boolean {
    return this.facade.canSubmitForm();
  }
}
