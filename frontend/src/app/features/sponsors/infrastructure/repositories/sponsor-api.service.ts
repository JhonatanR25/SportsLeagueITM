import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  toSponsorCategory,
} from '../../domain/models/sponsor-category.utils';
import { Sponsor } from '../../domain/models/sponsor.model';
import { SponsorUpsertPayload } from '../../domain/models/sponsor-upsert.model';
import { TournamentSponsor } from '../../domain/models/tournament-sponsor.model';

type SponsorApiResponse = Omit<Sponsor, 'category'> & {
  category: number | string;
};

@Injectable({
  providedIn: 'root',
})
export class SponsorApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/Sponsor`;
  private cache: Sponsor[] | null = null;
  private readonly tournamentsCache = new Map<number, TournamentSponsor[]>();

  getAll(): Observable<Sponsor[]> {
    if (this.cache) {
      return of(this.cache);
    }

    return this.http.get<SponsorApiResponse[]>(this.endpoint).pipe(
      map((items) => items.map((item) => this.mapSponsor(item))),
      tap((sponsors) => (this.cache = sponsors)),
    );
  }

  create(payload: SponsorUpsertPayload): Observable<Sponsor> {
    return this.http.post<SponsorApiResponse>(this.endpoint, payload).pipe(
      map((item) => this.mapSponsor(item)),
      tap(() => this.invalidateCache()),
    );
  }

  update(sponsorId: number, payload: SponsorUpsertPayload): Observable<void> {
    return this.http
      .put<void>(`${this.endpoint}/${sponsorId}`, payload)
      .pipe(tap(() => this.invalidateCache()));
  }

  delete(sponsorId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${sponsorId}`)
      .pipe(tap(() => this.invalidateCache()));
  }

  getTournaments(sponsorId: number): Observable<TournamentSponsor[]> {
    const cachedTournaments = this.tournamentsCache.get(sponsorId);

    if (cachedTournaments) {
      return of(cachedTournaments);
    }

    return this.http
      .get<TournamentSponsor[]>(`${this.endpoint}/${sponsorId}/tournaments`)
      .pipe(tap((items) => this.tournamentsCache.set(sponsorId, items)));
  }

  linkTournament(
    sponsorId: number,
    tournamentId: number,
    contractAmount: number,
  ): Observable<TournamentSponsor> {
    return this.http
      .post<TournamentSponsor>(`${this.endpoint}/${sponsorId}/tournaments`, {
        tournamentId,
        contractAmount,
      })
      .pipe(tap(() => this.invalidateTournamentsCache(sponsorId)));
  }

  unlinkTournament(sponsorId: number, tournamentId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.endpoint}/${sponsorId}/tournaments/${tournamentId}`)
      .pipe(tap(() => this.invalidateTournamentsCache(sponsorId)));
  }

  private mapSponsor(item: SponsorApiResponse): Sponsor {
    return {
      ...item,
      category: toSponsorCategory(item.category),
    };
  }

  private invalidateCache(): void {
    this.cache = null;
    this.tournamentsCache.clear();
  }

  private invalidateTournamentsCache(sponsorId: number): void {
    this.cache = null;
    this.tournamentsCache.delete(sponsorId);
  }
}
