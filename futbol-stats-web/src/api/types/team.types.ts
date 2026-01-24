import type { PlayerPosition } from './common.types';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  foundedYear: number | null;
  stadium: string | null;
  playersCount: number;
}

export interface TeamDetail extends Team {
  createdAt: string;
  updatedAt: string;
  players: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position: PlayerPosition;
  countryName: string | null;
  isActive: boolean;
}

export interface CreateTeamRequest {
  name: string;
  shortName: string;
  logoUrl?: string;
  foundedYear?: number;
  stadium?: string;
}

export interface UpdateTeamRequest extends CreateTeamRequest {}
