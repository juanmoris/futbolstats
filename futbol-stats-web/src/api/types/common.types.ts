export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export const ChampionshipStatus = {
  Upcoming: 0,
  InProgress: 1,
  Finished: 2,
} as const;

export type ChampionshipStatus = typeof ChampionshipStatus[keyof typeof ChampionshipStatus];

export const MatchStatus = {
  Scheduled: 0,
  Live: 1,
  HalfTime: 2,
  Finished: 3,
  Postponed: 4,
  Cancelled: 5,
} as const;

export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

export const PlayerPosition = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Forward: 3,
} as const;

export type PlayerPosition = typeof PlayerPosition[keyof typeof PlayerPosition];

export const EventType = {
  Goal: 0,
  OwnGoal: 1,
  Assist: 2,
  YellowCard: 3,
  RedCard: 4,
  SecondYellow: 5,
  SubstitutionIn: 6,
  SubstitutionOut: 7,
  PenaltyScored: 8,
  PenaltyMissed: 9,
} as const;

export type EventType = typeof EventType[keyof typeof EventType];
