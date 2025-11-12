import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types/user';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const USER_KEY = '@user';
const AUTH_STATE_KEY = '@auth_state';

WebBrowser.maybeCompleteAuthSession();

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const isGoogleAuthConfigured = (
    (Platform.OS === 'web' && webClientId) ||
    (Platform.OS === 'ios' && iosClientId) ||
    (Platform.OS === 'android' && androidClientId)
  );

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      webClientId: webClientId || undefined,
      iosClientId: iosClientId || undefined,
      androidClientId: androidClientId || undefined,
    }
  );

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    },
  });

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, [userQuery.data]);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      handleGoogleLogin(authentication?.accessToken);
    }
  }, [googleResponse]);

  const saveUserMutation = useMutation({
    mutationFn: async (newUser: User) => {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleGoogleLogin = async (accessToken: string | undefined) => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await response.json();

      const newUser: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        photoURL: userInfo.picture,
        provider: 'google',
        createdAt: new Date().toISOString(),
        licenseType: 'free',
      };

      setUser(newUser);
      setIsAuthenticated(true);
      saveUserMutation.mutate(newUser);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured) {
      throw new Error('Google authentication is not configured. Please contact support.');
    }
    try {
      await googlePromptAsync();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }, [googlePromptAsync, isGoogleAuthConfigured]);

  const signInWithApple = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const newUser: User = {
        id: credential.user,
        email: credential.email || '',
        name: `${credential.fullName?.givenName || ''} ${credential.fullName?.familyName || ''}`.trim() || 'Apple User',
        provider: 'apple',
        createdAt: new Date().toISOString(),
        licenseType: 'free',
      };

      setUser(newUser);
      setIsAuthenticated(true);
      saveUserMutation.mutate(newUser);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Error signing in with Apple:', error);
      }
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      provider: 'email',
      createdAt: new Date().toISOString(),
      licenseType: 'free',
    };

    setUser(newUser);
    setIsAuthenticated(true);
    saveUserMutation.mutate(newUser);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    if (!name.trim()) {
      throw new Error('Name is required');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      provider: 'email',
      createdAt: new Date().toISOString(),
      licenseType: 'free',
    };

    setUser(newUser);
    setIsAuthenticated(true);
    saveUserMutation.mutate(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    queryClient.invalidateQueries({ queryKey: ['user'] });
  }, [queryClient]);

  const updateLicense = useCallback((licenseType: 'free' | 'premium', expiresAt?: string) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      licenseType,
      licenseExpiresAt: expiresAt,
    };

    setUser(updatedUser);
    saveUserMutation.mutate(updatedUser);
  }, [user]);

  const isAppleAuthAvailable = Platform.OS === 'ios' || Platform.OS === 'macos';

  return {
    user,
    isAuthenticated,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateLicense,
    isAppleAuthAvailable,
    isGoogleAuthAvailable: isGoogleAuthConfigured,
  };
});
