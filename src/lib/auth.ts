// Auth utilities - Updated to use Firebase Auth
// This file is kept for backward compatibility
// New code should use firebaseAuth.ts

import { getAuthHeaders as getFirebaseAuthHeaders, isAuthenticated as isFirebaseAuthenticated } from './firebaseAuth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'clipper' | 'influencer' | null;
  balance?: number;
  pendingBalance?: number;
  budget?: number;
  status?: 'active' | 'suspended' | 'blacklisted' | 'pending' | 'verified';
  verified?: boolean;
  influencerStatus?: 'NOT_APPLIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Legacy auth object for backward compatibility
export const auth = {
  getToken: async (): Promise<string | null> => {
    // This will be handled by Firebase Auth
    return null;
  },

  setToken: (token: string): void => {
    // Tokens are managed by Firebase Auth
    // No need to store in localStorage
  },

  removeToken: (): void => {
    // Handled by Firebase Auth signOut
  },

  isAuthenticated: (): boolean => {
    return isFirebaseAuthenticated();
  },

  getAuthHeaders: async (): Promise<HeadersInit> => {
    return getFirebaseAuthHeaders();
  },
};

