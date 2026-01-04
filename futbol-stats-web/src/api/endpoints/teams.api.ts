import apiClient from '../client';
import type { PagedResult } from '../types/common.types';
import type {
  Team,
  TeamDetail,
  CreateTeamRequest,
  UpdateTeamRequest,
} from '../types/team.types';

export const teamsApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PagedResult<Team>> => {
    const response = await apiClient.get('/teams', { params });
    return response.data;
  },

  getById: async (id: string): Promise<TeamDetail> => {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data;
  },

  create: async (data: CreateTeamRequest): Promise<{ id: string }> => {
    const response = await apiClient.post('/teams', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTeamRequest): Promise<void> => {
    await apiClient.put(`/teams/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teams/${id}`);
  },
};
