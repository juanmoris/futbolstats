import type { PlayerPosition } from './common.types';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  number: number | null;
  position: PlayerPosition;
  birthDate: string | null;
  countryId: string | null;
  countryName: string | null;
  countryFlagUrl: string | null;
  photoUrl: string | null;
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  isActive: boolean;
}

export interface PlayerDetail extends Player {
  teamShortName: string;
  createdAt: string;
  updatedAt: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

export interface CreatePlayerRequest {
  firstName: string;
  lastName: string;
  number: number | null;
  position: PlayerPosition;
  birthDate?: string;
  countryId?: string;
  photoUrl?: string;
  teamId: string;
}

export interface UpdatePlayerRequest extends CreatePlayerRequest {
  isActive: boolean;
}
