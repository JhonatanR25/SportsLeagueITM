import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Team } from '../../domain/models/team.model';
import { TeamUpsertPayload } from '../../domain/models/team-upsert.model';

@Injectable({
  providedIn: 'root',
})
export class TeamApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Team`;
  private cache: Team[] | null = null;

  getAll(): Observable<Team[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<Team[]>(this.endpoint).pipe(tap((teams) => (this.cache = teams)));
  }

  create(payload: TeamUpsertPayload): Observable<Team> {
    return this.http.post<Team>(this.endpoint, payload).pipe(tap(() => this.invalidateCache()));
  }

  update(teamId: number, payload: TeamUpsertPayload): Observable<void> {
    return this.http
      .put<void>(`${this.endpoint}/${teamId}`, payload)
      .pipe(tap(() => this.invalidateCache()));
  }

  delete(teamId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${teamId}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  private invalidateCache(): void {
    this.cache = null;
  }
}
