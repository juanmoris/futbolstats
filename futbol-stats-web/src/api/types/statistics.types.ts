export interface StandingsResponse {
  championshipId: string;
  championshipName: string;
  season: string;
  standings: StandingEntry[];
  playersCount: number;
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
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

export interface Scorer {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  countryName: string | null;
  countryFlagUrl: string | null;
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
  photoUrl: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  position: string;
  countryName: string | null;
  countryFlagUrl: string | null;
  birthDate: string | null;
  number: number | null;
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
  teamStats: TeamStats[] | null;
  recentMatches: PlayerMatch[] | null;
}

export interface ChampionshipStats {
  championshipId: string;
  championshipName: string;
  season: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  matchesPlayed: number;
  matchesStarted: number;
  matchesAsSub: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerMatch {
  matchId: string;
  matchDate: string;
  championshipName: string;
  teamName: string;
  opponentName: string;
  opponentLogoUrl: string | null;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  isStarter: boolean;
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
  topPlayersByAppearances: PlayerAppearance[];
  championshipSummaries: ChampionshipSummary[] | null;
}

export interface TopScorer {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  countryName: string | null;
  countryFlagUrl: string | null;
  goals: number;
}

export interface PlayerAppearance {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  countryName: string | null;
  countryFlagUrl: string | null;
  matchesPlayed: number;
}

export interface CoachSummary {
  coachId: string;
  coachName: string;
  photoUrl: string | null;
  countryName: string | null;
  countryFlagUrl: string | null;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  firstMatchDate: string | null;
  lastMatchDate: string | null;
  isCurrentCoach: boolean;
}

export interface ChampionshipSummary {
  championshipId: string;
  championshipName: string;
  season: string;
  position: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  coaches: CoachSummary[];
}
