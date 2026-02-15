import apiClient from '../client';
import type {
  StandingsResponse,
  TopScorersResponse,
  PlayerStatisticsResponse,
  TeamStatisticsResponse,
  CoachStatisticsResponse,
  HistoricalTeamRankingsResponse,
  HistoricalTopScorersResponse,
  HistoricalMostAppearancesResponse,
} from '../types/statistics.types';

export const statisticsApi = {
  getStandings: async (championshipId: string): Promise<StandingsResponse> => {
    const response = await apiClient.get(`/statistics/championships/${championshipId}/standings`);
    return response.data;
  },

  getTopScorers: async (
    championshipId: string,
    page: number = 1,
    pageSize: number = 20,
    teamId?: string,
    search?: string
  ): Promise<TopScorersResponse> => {
    const response = await apiClient.get(`/statistics/championships/${championshipId}/top-scorers`, {
      params: { page, pageSize, teamId, search },
    });
    return response.data;
  },

  getPlayerStatistics: async (playerId: string, championshipId?: string): Promise<PlayerStatisticsResponse> => {
    const response = await apiClient.get(`/statistics/players/${playerId}`, {
      params: { championshipId },
    });
    return response.data;
  },

  getTeamStatistics: async (teamId: string, championshipId?: string): Promise<TeamStatisticsResponse> => {
    const response = await apiClient.get(`/statistics/teams/${teamId}`, {
      params: { championshipId },
    });
    return response.data;
  },

  getCoachStatistics: async (coachId: string, championshipId?: string): Promise<CoachStatisticsResponse> => {
    const response = await apiClient.get(`/statistics/coaches/${coachId}`, {
      params: { championshipId },
    });
    return response.data;
  },

  getHistoricalTeamRankings: async (search?: string): Promise<HistoricalTeamRankingsResponse> => {
    const response = await apiClient.get('/statistics/historical/team-rankings', {
      params: { search },
    });
    return response.data;
  },

  getHistoricalTopScorers: async (
    page: number = 1,
    pageSize: number = 20,
    countryId?: string,
    search?: string
  ): Promise<HistoricalTopScorersResponse> => {
    const response = await apiClient.get('/statistics/historical/top-scorers', {
      params: { page, pageSize, countryId, search },
    });
    return response.data;
  },

  getHistoricalMostAppearances: async (
    page: number = 1,
    pageSize: number = 20,
    countryId?: string,
    search?: string
  ): Promise<HistoricalMostAppearancesResponse> => {
    const response = await apiClient.get('/statistics/historical/most-appearances', {
      params: { page, pageSize, countryId, search },
    });
    return response.data;
  },
};
