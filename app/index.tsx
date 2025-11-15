import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';

export default function RootEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedModule');
        if (!isMounted) {
          return;
        }
        setStatus('redirecting');
        if (stored === 'rent') {
          router.replace('/(rent-tabs)/rent-dashboard');
          return;
        }
        if (stored === 'loan') {
          router.replace('/(tabs)/loan-dashboard');
          return;
        }
        router.replace('/module-selection');
      } catch (error) {
        console.error('Failed to determine initial module', error);
        router.replace('/module-selection');
      }
    };
    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="initial-loader">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.statusText}>
            {status === 'checking' ? 'Preparing your workspace...' : 'Redirecting to your module...'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loaderCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 52, 96, 0.75)',
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
