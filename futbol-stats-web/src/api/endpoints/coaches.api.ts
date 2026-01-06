import apiClient from '../client';
import type { PagedResult } from '../types/common.types';
import type {
  Coach,
  CoachDetail,
  CreateCoachRequest,
  UpdateCoachRequest,
  AssignCoachToTeamRequest,
  EndAssignmentRequest,
} from '../types/coach.types';

export const coachesApi = {
  getAll: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    const response = await apiClient.get<PagedResult<Coach>>('/coaches', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<CoachDetail>(`/coaches/${id}`);
    return response.data;
  },

  create: async (data: CreateCoachRequest) => {
    const response = await apiClient.post<{ id: string; fullName: string }>('/coaches', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCoachRequest) => {
    const response = await apiClient.put<{ id: string; fullName: string }>(`/coaches/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/coaches/${id}`);
  },

  assignToTeam: async (coachId: string, data: AssignCoachToTeamRequest) => {
    const response = await apiClient.post(`/coaches/${coachId}/assign`, data);
    return response.data;
  },

  endAssignment: async (coachId: string, data: EndAssignmentRequest) => {
    await apiClient.post(`/coaches/${coachId}/end-assignment`, data);
  },
};
