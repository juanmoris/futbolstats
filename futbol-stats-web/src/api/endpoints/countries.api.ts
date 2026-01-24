import apiClient from '../client';
import type { PagedResult } from '../types/common.types';
import type {
  Country,
  CreateCountryRequest,
  UpdateCountryRequest,
} from '../types/country.types';

export const countriesApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PagedResult<Country>> => {
    const response = await apiClient.get('/countries', { params });
    return response.data;
  },

  create: async (data: CreateCountryRequest): Promise<{ id: string }> => {
    const response = await apiClient.post('/countries', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCountryRequest): Promise<void> => {
    await apiClient.put(`/countries/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/countries/${id}`);
  },
};
