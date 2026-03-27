import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { Player } from '../../domain/models/player.model';
import { PlayerUpsertPayload } from '../../domain/models/player-upsert.model';
import { toPlayerPosition, toPlayerPositionCode } from '../../domain/models/player-position.utils';

type PlayerApiResponse = Omit<Player, 'position'> & {
  position: number | string;
};

@Injectable({
  providedIn: 'root',
})
export class PlayerApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Player`;
  private cache: Player[] | null = null;

  getAll(): Observable<Player[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<PlayerApiResponse[]>(this.endpoint).pipe(
      map((players) => players.map((player) => this.mapPlayer(player))),
      tap((players) => (this.cache = players)),
    );
  }

  create(payload: PlayerUpsertPayload): Observable<Player> {
    return this.http.post<PlayerApiResponse>(this.endpoint, this.toApiPayload(payload)).pipe(
      map((player) => this.mapPlayer(player)),
      tap(() => this.invalidateCache()),
    );
  }

  update(playerId: number, payload: PlayerUpsertPayload): Observable<void> {
    return this.http
      .put<void>(`${this.endpoint}/${playerId}`, this.toApiPayload(payload))
      .pipe(tap(() => this.invalidateCache()));
  }

  delete(playerId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${playerId}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  private mapPlayer(player: PlayerApiResponse): Player {
    return {
      ...player,
      position: toPlayerPosition(player.position),
    };
  }

  private toApiPayload(payload: PlayerUpsertPayload) {
    return {
      ...payload,
      position: toPlayerPositionCode(payload.position),
    };
  }

  private invalidateCache(): void {
    this.cache = null;
  }
}
