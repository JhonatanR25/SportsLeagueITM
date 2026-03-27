import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Team } from '../../../teams/domain/models/team.model';
import { Tournament } from '../../domain/models/tournament.model';
import { TournamentStatus } from '../../domain/models/tournament-status.type';
import {
  toTournamentStatus,
  toTournamentStatusCode,
} from '../../domain/models/tournament-status.utils';
import { TournamentUpsertPayload } from '../../domain/models/tournament-upsert.model';

type TournamentApiResponse = Omit<Tournament, 'status'> & {
  status: number | string;
};

@Injectable({
  providedIn: 'root',
})
export class TournamentApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Tournament`;
  private cache: Tournament[] | null = null;
  private readonly teamsCache = new Map<number, Team[]>();

  getAll(): Observable<Tournament[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<TournamentApiResponse[]>(this.endpoint).pipe(
      map((items) => items.map((item) => this.mapTournament(item))),
      tap((tournaments) => (this.cache = tournaments)),
    );
  }

  create(payload: TournamentUpsertPayload): Observable<Tournament> {
    return this.http.post<TournamentApiResponse>(this.endpoint, payload).pipe(
      map((item) => this.mapTournament(item)),
      tap(() => this.invalidateCache()),
    );
  }

  update(tournamentId: number, payload: TournamentUpsertPayload): Observable<void> {
    return this.http
      .put<void>(`${this.endpoint}/${tournamentId}`, payload)
      .pipe(tap(() => this.invalidateCache()));
  }

  delete(tournamentId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${tournamentId}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  updateStatus(tournamentId: number, status: TournamentStatus): Observable<void> {
    return this.http
      .patch<void>(`${this.endpoint}/${tournamentId}/status`, {
        status: toTournamentStatusCode(status),
      })
      .pipe(tap(() => this.invalidateCache()));
  }

  registerTeam(tournamentId: number, teamId: number): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.endpoint}/${tournamentId}/teams`, {
        teamId,
      })
      .pipe(tap(() => this.invalidateTeamsCache(tournamentId)));
  }

  getTeams(tournamentId: number): Observable<Team[]> {
    const cachedTeams = this.teamsCache.get(tournamentId);

    if (cachedTeams) {
      return of(cachedTeams);
    }

    return this.http
      .get<Team[]>(`${this.endpoint}/${tournamentId}/teams`)
      .pipe(tap((teams) => this.teamsCache.set(tournamentId, teams)));
  }

  private mapTournament(item: TournamentApiResponse): Tournament {
    return {
      ...item,
      status: toTournamentStatus(item.status),
    };
  }

  private invalidateCache(): void {
    this.cache = null;
    this.teamsCache.clear();
  }

  private invalidateTeamsCache(tournamentId: number): void {
    this.cache = null;
    this.teamsCache.delete(tournamentId);
  }
}
