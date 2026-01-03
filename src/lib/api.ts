// API configuration
// In production (Firebase), API calls go to Firebase Functions
// In development, they proxy to localhost:3000 via vite.config.ts
import { getAuthHeaders } from './firebaseAuth';

// For Firebase deployment, use the Firebase Functions URL
// For local development, use /api (proxied to localhost:3000)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? `https://${import.meta.env.VITE_FIREBASE_REGION || 'us-central1'}-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/api`
    : '/api'
  );

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


