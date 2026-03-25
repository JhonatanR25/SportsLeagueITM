import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Match } from '../../domain/models/match.model';
import { MatchStatus } from '../../domain/models/match-status.type';
import { toMatchStatus, toMatchStatusCode } from '../../domain/models/match-status.utils';
import { MatchCreatePayload } from '../../domain/models/match-create.model';

type MatchApiResponse = Omit<Match, 'status'> & {
  status: number | string;
};

type MatchFilters = {
  tournamentId?: number;
  status?: MatchStatus | '';
  fromDate?: string;
  toDate?: string;
};

@Injectable({
  providedIn: 'root',
})
export class MatchApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Match`;

  getAll(filters?: MatchFilters): Observable<Match[]> {
    let params = new HttpParams();

    if (filters?.tournamentId) params = params.set('tournamentId', filters.tournamentId);
    if (filters?.status) params = params.set('status', toMatchStatusCode(filters.status));
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);

    return this.http
      .get<MatchApiResponse[]>(this.endpoint, { params })
      .pipe(map((items) => items.map((item) => this.mapMatch(item))));
  }

  create(payload: MatchCreatePayload): Observable<Match> {
    return this.http
      .post<MatchApiResponse>(this.endpoint, payload)
      .pipe(map((item) => this.mapMatch(item)));
  }

  updateStatus(matchId: number, status: MatchStatus): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/${matchId}/status`, {
      status: toMatchStatusCode(status),
    });
  }

  updateScore(matchId: number, homeScore: number, awayScore: number, isFinalScore: boolean): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/${matchId}/score`, {
      homeScore,
      awayScore,
      isFinalScore,
    });
  }

  private mapMatch(item: MatchApiResponse): Match {
    return { ...item, status: toMatchStatus(item.status) };
  }
}
