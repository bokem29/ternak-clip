// Firebase Authentication utilities
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

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

// Get Firebase Auth token
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

// Get auth headers with Firebase token
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to translate Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (error: any): string => {
  const code = error?.code || '';
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format email tidak valid. Silakan periksa kembali email Anda.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/user-not-found':
      return 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
      return 'Password salah. Silakan coba lagi.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan. Hubungi administrator.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa koneksi Anda.';
    case 'auth/operation-not-allowed':
      return 'Operasi tidak diizinkan. Hubungi administrator.';
    default:
      return error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
  }
};

// Login with Firebase Auth
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Get user data from backend
    const response = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data pengguna. Pastikan backend server berjalan.');
    }
    
    const userData = await response.json();
    
    return {
      token,
      user: userData
    };
  } catch (error: any) {
    const friendlyMessage = getFirebaseErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

// Register with Firebase Auth
export const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // Get user data from backend (will create user in Firestore if not exists)
    const response = await fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data pengguna. Pastikan backend server berjalan.');
    }
    
    const userData = await response.json();
    
    return {
      token,
      user: userData
    };
  } catch (error: any) {
    const friendlyMessage = getFirebaseErrorMessage(error);
    throw new Error(friendlyMessage);
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};


