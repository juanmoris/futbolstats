import apiClient from '../client';
import type { PagedResult, PlayerPosition } from '../types/common.types';
import type {
  Player,
  PlayerDetail,
  CreatePlayerRequest,
  UpdatePlayerRequest,
} from '../types/player.types';

export const playersApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    teamId?: string;
    position?: PlayerPosition;
    search?: string;
    onlyActive?: boolean;
  }): Promise<PagedResult<Player>> => {
    const response = await apiClient.get('/players', { params });
    return response.data;
  },

  getById: async (id: string): Promise<PlayerDetail> => {
    const response = await apiClient.get(`/players/${id}`);
    return response.data;
  },

  create: async (data: CreatePlayerRequest): Promise<{ id: string }> => {
    const response = await apiClient.post('/players', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePlayerRequest): Promise<void> => {
    await apiClient.put(`/players/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
  },
};
