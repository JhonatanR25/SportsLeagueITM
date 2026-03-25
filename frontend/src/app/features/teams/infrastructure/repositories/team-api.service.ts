import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Team } from '../../domain/models/team.model';
import { TeamUpsertPayload } from '../../domain/models/team-upsert.model';

@Injectable({
  providedIn: 'root',
})
export class TeamApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Team`;

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(this.endpoint);
  }

  create(payload: TeamUpsertPayload): Observable<Team> {
    return this.http.post<Team>(this.endpoint, payload);
  }

  update(teamId: number, payload: TeamUpsertPayload): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${teamId}`, payload);
  }

  delete(teamId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${teamId}`);
  }
}
