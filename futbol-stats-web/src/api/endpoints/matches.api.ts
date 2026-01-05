import apiClient from '../client';
import type { PagedResult, MatchStatus } from '../types/common.types';
import type {
  Match,
  MatchDetail,
  CreateMatchRequest,
  SetLineupRequest,
  RecordGoalRequest,
  RecordCardRequest,
  RecordSubstitutionRequest,
} from '../types/match.types';

export const matchesApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    championshipId?: string;
    teamId?: string;
    status?: MatchStatus;
    matchday?: number;
  }): Promise<PagedResult<Match>> => {
    const response = await apiClient.get('/matches', { params });
    return response.data;
  },

  getById: async (id: string): Promise<MatchDetail> => {
    const response = await apiClient.get(`/matches/${id}`);
    return response.data;
  },

  getLive: async (): Promise<Match[]> => {
    const response = await apiClient.get('/matches/live');
    return response.data;
  },

  create: async (data: CreateMatchRequest): Promise<{ id: string }> => {
    const response = await apiClient.post('/matches', data);
    return response.data;
  },

  start: async (id: string): Promise<void> => {
    await apiClient.post(`/matches/${id}/start`);
  },

  halftime: async (id: string): Promise<void> => {
    await apiClient.post(`/matches/${id}/halftime`);
  },

  end: async (id: string): Promise<void> => {
    await apiClient.post(`/matches/${id}/end`);
  },

  setLineup: async (matchId: string, data: SetLineupRequest): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/lineup`, data);
  },

  recordGoal: async (matchId: string, data: RecordGoalRequest): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/events/goal`, data);
  },

  recordCard: async (matchId: string, data: RecordCardRequest): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/events/card`, data);
  },

  recordSubstitution: async (matchId: string, data: RecordSubstitutionRequest): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/events/substitution`, data);
  },

  deleteEvent: async (matchId: string, eventId: string): Promise<void> => {
    await apiClient.delete(`/matches/${matchId}/events/${eventId}`);
  },
};
