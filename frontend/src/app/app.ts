import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  constructor() {
    if (!isPlatformBrowser(this.platformId) || !this.isBrowserReload()) {
      return;
    }

    void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }

  private isBrowserReload(): boolean {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    return navigationEntry?.type === 'reload';
  }
}
