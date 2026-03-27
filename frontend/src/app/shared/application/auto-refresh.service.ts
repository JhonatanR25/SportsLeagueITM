import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { filter, fromEvent, interval, map, merge, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AutoRefreshService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  watch(intervalMs = 30000): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return new Observable<void>();
    }

    const focus$ = fromEvent(window, 'focus').pipe(map(() => undefined));
    const visible$ = fromEvent(this.document, 'visibilitychange').pipe(
      filter(() => this.document.visibilityState === 'visible'),
      map(() => undefined),
    );
    const poll$ = interval(intervalMs).pipe(
      filter(() => this.document.visibilityState === 'visible'),
      map(() => undefined),
    );

    return merge(focus$, visible$, poll$);
  }
}
