import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { AlertSettings } from '@/types/customer';

const ALERT_SETTINGS_KEY = '@alertSettings';

const defaultSettings: AlertSettings = {
  enabled: true,
  daysBeforeDue: 3,
  onDueDate: true,
  afterDueDays: [1, 3, 7],
  autoSendWhatsApp: false,
};

export const [AlertSettingsProvider, useAlertSettings] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);

  const settingsQuery = useQuery({
    queryKey: ['alertSettings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ALERT_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AlertSettings) => {
      await AsyncStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertSettings'] });
    },
  });

  const updateSettings = useCallback((updates: Partial<AlertSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  }, [settings]);

  return {
    settings,
    updateSettings,
    isLoading: settingsQuery.isLoading,
  };
});
