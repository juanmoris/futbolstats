export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}
