import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

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
  private readonly cache = new Map<string, Match[]>();

  getAll(filters?: MatchFilters): Observable<Match[]> {
    const cacheKey = this.buildCacheKey(filters);
    const cachedMatches = this.cache.get(cacheKey);

    if (cachedMatches) {
      return of(cachedMatches);
    }

    let params = new HttpParams();

    if (filters?.tournamentId) params = params.set('tournamentId', filters.tournamentId);
    if (filters?.status) params = params.set('status', toMatchStatusCode(filters.status));
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);

    return this.http.get<MatchApiResponse[]>(this.endpoint, { params }).pipe(
      map((items) => items.map((item) => this.mapMatch(item))),
      tap((matches) => this.cache.set(cacheKey, matches)),
    );
  }

  create(payload: MatchCreatePayload): Observable<Match> {
    return this.http.post<MatchApiResponse>(this.endpoint, payload).pipe(
      map((item) => this.mapMatch(item)),
      tap(() => this.invalidateCache()),
    );
  }

  updateStatus(matchId: number, status: MatchStatus): Observable<void> {
    return this.http
      .patch<void>(`${this.endpoint}/${matchId}/status`, {
        status: toMatchStatusCode(status),
      })
      .pipe(tap(() => this.invalidateCache()));
  }

  updateScore(
    matchId: number,
    homeScore: number,
    awayScore: number,
    isFinalScore: boolean,
  ): Observable<void> {
    return this.http
      .patch<void>(`${this.endpoint}/${matchId}/score`, {
        homeScore,
        awayScore,
        isFinalScore,
      })
      .pipe(tap(() => this.invalidateCache()));
  }

  private mapMatch(item: MatchApiResponse): Match {
    return { ...item, status: toMatchStatus(item.status) };
  }

  private buildCacheKey(filters?: MatchFilters): string {
    return JSON.stringify({
      tournamentId: filters?.tournamentId ?? null,
      status: filters?.status ?? null,
      fromDate: filters?.fromDate ?? null,
      toDate: filters?.toDate ?? null,
    });
  }

  private invalidateCache(): void {
    this.cache.clear();
  }
}
