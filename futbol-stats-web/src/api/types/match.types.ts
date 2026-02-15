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
  homeCoachId: string | null;
  homeCoachName: string | null;
  homeCoachCountryFlagUrl: string | null;
  awayCoachId: string | null;
  awayCoachName: string | null;
  awayCoachCountryFlagUrl: string | null;
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
  playerId: string | null;
  playerName: string | null;
  coachId: string | null;
  coachName: string | null;
  teamId: string;
  eventType: EventType;
  minute: number;
  extraMinute: number | null;
  description: string | null;
}

export interface LineupPlayer {
  playerId: string;
  playerName: string;
  countryFlagUrl: string | null;
  jerseyNumber: number | null;
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

export interface UpdateMatchRequest {
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

export interface RecordPenaltyMissedRequest {
  playerId: string;
  teamId: string;
  minute: number;
  extraMinute?: number;
  description?: string;
}

export interface RecordCoachCardRequest {
  coachId: string;
  teamId: string;
  minute: number;
  extraMinute?: number;
  isRed: boolean;
  reason?: string;
}

export interface SetLineupRequest {
  teamId: string;
  players: LineupPlayerRequest[];
}

export interface LineupPlayerRequest {
  playerId: string;
  isStarter: boolean;
  position?: string;
  jerseyNumber: number | null;
}

export interface HeadToHeadResponse {
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAGoals: number;
  teamBGoals: number;
  teamAId: string;
  teamAName: string;
  teamALogo: string | null;
  teamBId: string;
  teamBName: string;
  teamBLogo: string | null;
  matches: HeadToHeadMatch[];
}

export interface HeadToHeadMatch {
  id: string;
  championshipId: string;
  championshipName: string;
  season: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string | null;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  matchday: number;
}
