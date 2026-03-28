import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string;
  purchaseDate?: string;
  isLifetime: boolean;
}

export interface SubscriptionFeatures {
  maxCustomers: number | null;
  maxLoans: number | null;
  advancedReports: boolean;
  exportReports: boolean;
  autoBackup: boolean;
  whatsappReminders: boolean;
  customCurrency: boolean;
  multipleInterestMethods: boolean;
  noAds: boolean;
  prioritySupport: boolean;
}

const FREE_FEATURES: SubscriptionFeatures = {
  maxCustomers: 10,
  maxLoans: 20,
  advancedReports: false,
  exportReports: false,
  autoBackup: false,
  whatsappReminders: true,
  customCurrency: false,
  multipleInterestMethods: false,
  noAds: false,
  prioritySupport: false,
};

const PREMIUM_FEATURES: SubscriptionFeatures = {
  maxCustomers: null,
  maxLoans: null,
  advancedReports: true,
  exportReports: true,
  autoBackup: true,
  whatsappReminders: true,
  customCurrency: true,
  multipleInterestMethods: true,
  noAds: true,
  prioritySupport: true,
};

export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 9.99,
    priceString: '$9.99',
    interval: 'month' as const,
    description: 'All features, billed monthly',
  },
  yearly: {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 79.99,
    priceString: '$79.99',
    interval: 'year' as const,
    description: 'All features, save 33%',
    savings: 'Save $40 per year',
  },
  lifetime: {
    id: 'premium_lifetime',
    name: 'Lifetime Premium',
    price: 149.99,
    priceString: '$149.99',
    interval: 'lifetime' as const,
    description: 'Pay once, use forever',
    popular: true,
  },
};

const STORAGE_KEY = '@subscription_state';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    tier: 'free',
    isLifetime: false,
  });

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      console.log('[Subscription] Loading subscription state...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: SubscriptionState = JSON.parse(stored);
        
        if (state.tier === 'premium' && !state.isLifetime && state.expiresAt) {
          const expiresAt = new Date(state.expiresAt);
          if (expiresAt < new Date()) {
            console.log('[Subscription] Subscription expired, reverting to free');
            const freeState: SubscriptionState = { tier: 'free', isLifetime: false };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freeState));
            return freeState;
          }
        }
        
        console.log('[Subscription] Loaded state:', state);
        return state;
      }
      
      const initialState: SubscriptionState = { tier: 'free', isLifetime: false };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
      return initialState;
    },
  });

  useEffect(() => {
    if (subscriptionQuery.data) {
      setSubscriptionState(subscriptionQuery.data);
    }
  }, [subscriptionQuery.data]);

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      console.log('[Subscription] Upgrading to plan:', planId);
      
      if (Platform.OS === 'web') {
        console.log('[Subscription] Web platform - simulating purchase');
      }
      
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan');
      }
      
      const newState: SubscriptionState = {
        tier: 'premium',
        purchaseDate: new Date().toISOString(),
        isLifetime: plan.interval === 'lifetime',
      };
      
      if (plan.interval !== 'lifetime') {
        const expiresAt = new Date();
        if (plan.interval === 'month') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (plan.interval === 'year') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }
        newState.expiresAt = expiresAt.toISOString();
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    },
    onSuccess: (newState) => {
      console.log('[Subscription] Upgrade successful:', newState);
      setSubscriptionState(newState);
      subscriptionQuery.refetch();
    },
  });

  const restorePurchasesMutation = useMutation({
    mutationFn: async () => {
      console.log('[Subscription] Restoring purchases...');
      
      if (Platform.OS === 'web') {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
        throw new Error('No purchases to restore');
      }
      
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('No purchases to restore');
    },
    onSuccess: (state) => {
      console.log('[Subscription] Restored:', state);
      setSubscriptionState(state);
      subscriptionQuery.refetch();
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      console.log('[Subscription] Canceling subscription...');
      const freeState: SubscriptionState = { tier: 'free', isLifetime: false };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freeState));
      return freeState;
    },
    onSuccess: (state) => {
      console.log('[Subscription] Canceled');
      setSubscriptionState(state);
      subscriptionQuery.refetch();
    },
  });

  const isPremium = subscriptionState.tier === 'premium';
  const features = useMemo(() => isPremium ? PREMIUM_FEATURES : FREE_FEATURES, [isPremium]);
  
  const canAccessFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    return features[feature] === true || features[feature] === null;
  }, [features]);

  const isFeatureLimited = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    if (isPremium) return false;
    return !canAccessFeature(feature);
  }, [isPremium, canAccessFeature]);

  return useMemo(() => ({
    subscription: subscriptionState,
    isPremium,
    features,
    isLoading: subscriptionQuery.isLoading,
    canAccessFeature,
    isFeatureLimited,
    upgrade: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,
    restorePurchases: restorePurchasesMutation.mutateAsync,
    isRestoring: restorePurchasesMutation.isPending,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,
    isCanceling: cancelSubscriptionMutation.isPending,
    refetch: subscriptionQuery.refetch,
  }), [
    subscriptionState,
    isPremium,
    features,
    subscriptionQuery.isLoading,
    subscriptionQuery.refetch,
    canAccessFeature,
    isFeatureLimited,
    upgradeMutation.mutateAsync,
    upgradeMutation.isPending,
    restorePurchasesMutation.mutateAsync,
    restorePurchasesMutation.isPending,
    cancelSubscriptionMutation.mutateAsync,
    cancelSubscriptionMutation.isPending,
  ]);
});
