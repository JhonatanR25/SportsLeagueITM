import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Referee } from '../../domain/models/referee.model';
import { RefereeUpsertPayload } from '../../domain/models/referee-upsert.model';

@Injectable({
  providedIn: 'root',
})
export class RefereeApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Referee`;

  getAll(): Observable<Referee[]> {
    return this.http.get<Referee[]>(this.endpoint);
  }

  create(payload: RefereeUpsertPayload): Observable<Referee> {
    return this.http.post<Referee>(this.endpoint, payload);
  }

  update(refereeId: number, payload: RefereeUpsertPayload): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${refereeId}`, payload);
  }

  delete(refereeId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${refereeId}`);
  }
}
