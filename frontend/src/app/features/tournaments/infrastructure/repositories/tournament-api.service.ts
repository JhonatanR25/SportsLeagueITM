import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

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

  getAll(): Observable<Tournament[]> {
    return this.http
      .get<TournamentApiResponse[]>(this.endpoint)
      .pipe(map((items) => items.map((item) => this.mapTournament(item))));
  }

  create(payload: TournamentUpsertPayload): Observable<Tournament> {
    return this.http
      .post<TournamentApiResponse>(this.endpoint, payload)
      .pipe(map((item) => this.mapTournament(item)));
  }

  update(tournamentId: number, payload: TournamentUpsertPayload): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${tournamentId}`, payload);
  }

  delete(tournamentId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${tournamentId}`);
  }

  updateStatus(tournamentId: number, status: TournamentStatus): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/${tournamentId}/status`, {
      status: toTournamentStatusCode(status),
    });
  }

  registerTeam(tournamentId: number, teamId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.endpoint}/${tournamentId}/teams`, { teamId });
  }

  getTeams(tournamentId: number): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.endpoint}/${tournamentId}/teams`);
  }

  private mapTournament(item: TournamentApiResponse): Tournament {
    return {
      ...item,
      status: toTournamentStatus(item.status),
    };
  }
}
