import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

export default function InitialScreen() {
  const router = useRouter();

  useEffect(() => {
    checkModule();
  }, []);

  const checkModule = async () => {
    const selectedModule = await AsyncStorage.getItem('selectedModule');
    
    if (!selectedModule) {
      router.replace('/module-selection');
      return;
    }

    if (selectedModule === 'loan') {
      router.replace('/loan-dashboard');
      return;
    }

    router.replace('/rent-dashboard');
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
