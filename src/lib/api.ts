// API configuration
// In production (Vercel), API calls go to /api (Vercel serverless functions)
// In development, they proxy to localhost:3000 via vite.config.ts
import { getAuthHeaders } from './firebaseAuth';

// For Vercel deployment, use /api (Vercel serverless functions)
// For local development, use /api (proxied to localhost:3000)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  get: async (endpoint: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error: any) {
      // Re-throw with more context
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Backend server is not running. Please start it with: npm run dev:backend');
      }
      throw error;
    }
  },
  post: async (endpoint: string, data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
  put: async (endpoint: string, data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
  patch: async (endpoint: string, data: any) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
  delete: async (endpoint: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API Error: ${response.statusText}`);
    }
    return response.json();
  },
};


