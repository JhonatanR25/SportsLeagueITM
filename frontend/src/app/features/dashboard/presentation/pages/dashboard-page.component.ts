import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AutoRefreshService } from '../../../../shared/application/auto-refresh.service';
import { StateCardComponent } from '../../../../shared/presentation/components/state-card/state-card.component';
import { DashboardPageFacade } from '../../application/facades/dashboard-page.facade';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StateCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  providers: [DashboardPageFacade],
})
export class DashboardPageComponent {
  private readonly facade = inject(DashboardPageFacade);
  private readonly autoRefresh = inject(AutoRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentSeason = this.facade.currentSeason;
  protected readonly isLoading = this.facade.isLoading;
  protected readonly errorMessage = this.facade.errorMessage;
  protected readonly modules = this.facade.modules;

  constructor() {
    this.facade.loadDashboard();
    this.autoRefresh
      .watch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.facade.retry());
  }

  protected retry(): void {
    this.facade.retry();
  }
}
