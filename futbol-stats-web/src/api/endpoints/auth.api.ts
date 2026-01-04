import apiClient from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  CurrentUserResponse,
} from '../types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/auth/refresh', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
