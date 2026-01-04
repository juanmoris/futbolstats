import type { ChampionshipStatus } from './common.types';

export interface Championship {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  status: ChampionshipStatus;
  teamsCount: number;
}

export interface ChampionshipDetail extends Championship {
  createdAt: string;
  updatedAt: string;
  teams: ChampionshipTeam[];
}

export interface ChampionshipTeam {
  teamId: string;
  teamName: string;
  shortName: string;
  logoUrl: string | null;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface CreateChampionshipRequest {
  name: string;
  season: string;
  startDate: string;
  endDate: string;
}

export interface UpdateChampionshipRequest extends CreateChampionshipRequest {
  status: ChampionshipStatus;
}
