import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ManagementModule = 'loan' | 'rent';

const STORAGE_KEY = 'selectedModule';

type ModuleContextValue = {
  selectedModule: ManagementModule | null;
  isInitializing: boolean;
  selectModule: (module: ManagementModule) => Promise<void>;
  resetModule: () => Promise<void>;
  refreshModule: () => Promise<void>;
};

export const [ModuleProvider, useModule] = createContextHook<ModuleContextValue>(() => {
  const [selectedModule, setSelectedModule] = useState<ManagementModule | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const loadStoredModule = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'loan' || stored === 'rent') {
        setSelectedModule(stored);
      } else {
        setSelectedModule(null);
      }
    } catch (error) {
      console.error('[ModuleContext] Failed to load stored module', error);
      setSelectedModule(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    void loadStoredModule();
  }, [loadStoredModule]);

  const selectModule = useCallback(async (module: ManagementModule) => {
    try {
      console.log('[ModuleContext] Selecting module', module);
      setSelectedModule(module);
      await AsyncStorage.setItem(STORAGE_KEY, module);
    } catch (error) {
      console.error('[ModuleContext] Failed to persist module selection', error);
      throw error;
    }
  }, []);

  const resetModule = useCallback(async () => {
    try {
      console.log('[ModuleContext] Resetting module selection');
      setSelectedModule(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[ModuleContext] Failed to reset module selection', error);
      throw error;
    }
  }, []);

  const refreshModule = useCallback(async () => {
    setIsInitializing(true);
    await loadStoredModule();
  }, [loadStoredModule]);

  return useMemo(
    () => ({
      selectedModule,
      isInitializing,
      selectModule,
      resetModule,
      refreshModule,
    }),
    [selectedModule, isInitializing, selectModule, resetModule, refreshModule],
  );
});
