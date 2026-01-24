export interface Country {
  id: string;
  name: string;
  code: string;
  flagUrl?: string;
  playersCount: number;
}

export interface CreateCountryRequest {
  name: string;
  code: string;
  flagUrl?: string;
}

export interface UpdateCountryRequest {
  name: string;
  code: string;
  flagUrl?: string;
}
