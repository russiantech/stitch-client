// src/config/api.ts

let _cachedApiUrl: string | null = null;

export function getApiUrl(): string {
  if (_cachedApiUrl) return _cachedApiUrl;
  const env = (import.meta as any).env;
  _cachedApiUrl = env?.VITE_API_URL || 'http://localhost:8000/api/v1';
  return _cachedApiUrl!;
  
}

export const API_BASE_URL = getApiUrl();