import apiClient from '../client';
import type {
  StandingsResponse,
  TopScorersResponse,
  PlayerStatisticsResponse,
  TeamStatisticsResponse,
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
};
