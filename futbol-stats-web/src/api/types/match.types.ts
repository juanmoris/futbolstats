import type { MatchStatus, EventType } from './common.types';

export interface Match {
  id: string;
  championshipId: string;
  championshipName: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string | null;
  matchDate: string;
  stadium: string | null;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  matchday: number;
  currentMinute: number | null;
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  homeLineup: LineupPlayer[];
  awayLineup: LineupPlayer[];
}

export interface MatchEvent {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  eventType: EventType;
  minute: number;
  extraMinute: number | null;
  description: string | null;
}

export interface LineupPlayer {
  playerId: string;
  playerName: string;
  number: number;
  position: string;
  isStarter: boolean;
}

export interface CreateMatchRequest {
  championshipId: string;
  homeTeamId: string;
  awayTeamId: string;
  matchDate: string;
  stadium?: string;
  matchday: number;
}

export interface RecordGoalRequest {
  scorerId: string;
  teamId: string;
  minute: number;
  extraMinute?: number;
  assistPlayerId?: string;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

export interface RecordCardRequest {
  playerId: string;
  teamId: string;
  minute: number;
  extraMinute?: number;
  isRed: boolean;
  reason?: string;
}

export interface RecordSubstitutionRequest {
  playerOutId: string;
  playerInId: string;
  teamId: string;
  minute: number;
  extraMinute?: number;
}

export interface SetLineupRequest {
  teamId: string;
  players: LineupPlayerRequest[];
}

export interface LineupPlayerRequest {
  playerId: string;
  isStarter: boolean;
  position?: string;
  jerseyNumber: number;
}
