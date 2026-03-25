import { MatchStatus } from './match-status.type';

const statusCodeMap: Record<number, MatchStatus> = {
  1: 'Scheduled',
  2: 'InProgress',
  3: 'Finished',
  4: 'Suspended',
};

const statusValueMap: Record<MatchStatus, number> = {
  Scheduled: 1,
  InProgress: 2,
  Finished: 3,
  Suspended: 4,
};

export function toMatchStatus(value: number | string): MatchStatus {
  if (typeof value === 'string') {
    if (value in statusValueMap) {
      return value as MatchStatus;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed in statusCodeMap) {
      return statusCodeMap[parsed];
    }
  }

  if (typeof value === 'number' && value in statusCodeMap) {
    return statusCodeMap[value];
  }

  return 'Scheduled';
}

export function toMatchStatusCode(status: MatchStatus): number {
  return statusValueMap[status];
}
