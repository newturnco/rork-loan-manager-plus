export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  provider: 'email' | 'google' | 'apple';
  createdAt: string;
  licenseType: 'free' | 'premium';
  licenseExpiresAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
