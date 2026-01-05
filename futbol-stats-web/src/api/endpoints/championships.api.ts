import apiClient from '../client';
import type { PagedResult, ChampionshipStatus } from '../types/common.types';
import type {
  Championship,
  ChampionshipDetail,
  CreateChampionshipRequest,
  UpdateChampionshipRequest,
} from '../types/championship.types';

export const championshipsApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: ChampionshipStatus;
  }): Promise<PagedResult<Championship>> => {
    const response = await apiClient.get('/championships', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ChampionshipDetail> => {
    const response = await apiClient.get(`/championships/${id}`);
    return response.data;
  },

  create: async (data: CreateChampionshipRequest): Promise<{ id: string }> => {
    const response = await apiClient.post('/championships', data);
    return response.data;
  },

  update: async (id: string, data: UpdateChampionshipRequest): Promise<void> => {
    await apiClient.put(`/championships/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/championships/${id}`);
  },

  addTeam: async (championshipId: string, teamId: string): Promise<void> => {
    await apiClient.post(`/championships/${championshipId}/teams`, { teamId });
  },

  removeTeam: async (championshipId: string, teamId: string): Promise<void> => {
    await apiClient.delete(`/championships/${championshipId}/teams/${teamId}`);
  },

  recalculateStandings: async (championshipId: string): Promise<{ teamsUpdated: number; matchesProcessed: number }> => {
    const response = await apiClient.post(`/championships/${championshipId}/recalculate-standings`);
    return response.data;
  },
};
