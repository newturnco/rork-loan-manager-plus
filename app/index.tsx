import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import { useModule } from '@/contexts/ModuleContext';

export default function RootEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isInitializing } = useModule();
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');

  useEffect(() => {
    if (isInitializing) {
      return;
    }
    setStatus('redirecting');
    console.log('[RootEntry] Navigating to module selection');
    router.replace('/module-selection');
  }, [isInitializing, router]);

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
