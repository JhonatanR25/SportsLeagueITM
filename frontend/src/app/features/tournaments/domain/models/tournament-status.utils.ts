import { TournamentStatus } from './tournament-status.type';

const statusCodeMap: Record<number, TournamentStatus> = {
  0: 'Pending',
  1: 'InProgress',
  2: 'Finished',
};

const statusValueMap: Record<TournamentStatus, number> = {
  Pending: 0,
  InProgress: 1,
  Finished: 2,
};

export function toTournamentStatus(value: number | string): TournamentStatus {
  if (typeof value === 'string') {
    if (value in statusValueMap) {
      return value as TournamentStatus;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed in statusCodeMap) {
      return statusCodeMap[parsed];
    }
  }

  if (typeof value === 'number' && value in statusCodeMap) {
    return statusCodeMap[value];
  }

  return 'Pending';
}

export function toTournamentStatusCode(status: TournamentStatus): number {
  return statusValueMap[status];
}
