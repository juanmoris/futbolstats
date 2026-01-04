export interface StandingsResponse {
  championshipId: string;
  championshipName: string;
  season: string;
  standings: StandingEntry[];
}

export interface StandingEntry {
  position: number;
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TopScorersResponse {
  championshipId: string;
  championshipName: string;
  scorers: Scorer[];
}

export interface Scorer {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  goals: number;
  penaltyGoals: number;
  assists: number;
  matchesPlayed: number;
}

export interface PlayerStatisticsResponse {
  playerId: string;
  playerName: string;
  teamName: string;
  position: string;
  matchesPlayed: number;
  matchesStarted: number;
  matchesAsSub: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  penaltiesScored: number;
  penaltiesMissed: number;
  championshipStats: ChampionshipStats[] | null;
}

export interface ChampionshipStats {
  championshipId: string;
  championshipName: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface TeamStatisticsResponse {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  topScorers: TopScorer[];
  championshipSummaries: ChampionshipSummary[] | null;
}

export interface TopScorer {
  playerId: string;
  playerName: string;
  goals: number;
}

export interface ChampionshipSummary {
  championshipId: string;
  championshipName: string;
  position: number;
  matchesPlayed: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}
