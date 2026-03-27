import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Referee } from '../../domain/models/referee.model';
import { RefereeUpsertPayload } from '../../domain/models/referee-upsert.model';

@Injectable({
  providedIn: 'root',
})
export class RefereeApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Referee`;
  private cache: Referee[] | null = null;

  getAll(): Observable<Referee[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<Referee[]>(this.endpoint).pipe(tap((referees) => (this.cache = referees)));
  }

  create(payload: RefereeUpsertPayload): Observable<Referee> {
    return this.http.post<Referee>(this.endpoint, payload).pipe(tap(() => this.invalidateCache()));
  }

  update(refereeId: number, payload: RefereeUpsertPayload): Observable<void> {
    return this.http
      .put<void>(`${this.endpoint}/${refereeId}`, payload)
      .pipe(tap(() => this.invalidateCache()));
  }

  delete(refereeId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${refereeId}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  private invalidateCache(): void {
    this.cache = null;
  }
}
