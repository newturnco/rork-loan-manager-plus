import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import LocalBackupService from '@/services/LocalBackupService';
import { Platform } from 'react-native';

const BACKUP_SETTINGS_KEY = '@backup_settings';

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate: string | null;
}

const DEFAULT_SETTINGS: BackupSettings = {
  autoBackupEnabled: false,
  autoBackupFrequency: 'weekly',
  lastBackupDate: null,
};

export const [BackupProvider, useBackup] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<BackupSettings>(DEFAULT_SETTINGS);

  const settingsQuery = useQuery({
    queryKey: ['backup-settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BACKUP_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: BackupSettings) => {
      await AsyncStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-settings'] });
    },
  });

  const { mutate: saveSettings } = saveSettingsMutation;

  const updateSettings = useCallback((updates: Partial<BackupSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const exportBackupMutation = useMutation({
    mutationFn: async () => {
      const result = await LocalBackupService.exportBackupToFile();
      if (!result) {
        throw new Error('Failed to export backup');
      }
      updateSettings({ lastBackupDate: new Date().toISOString() });
      return result;
    },
  });

  const importBackupMutation = useMutation({
    mutationFn: async () => {
      const backup = await LocalBackupService.importBackupFromFile();
      if (!backup) {
        throw new Error('Failed to import backup or user cancelled');
      }
      
      const success = await LocalBackupService.restoreBackup(backup);
      if (!success) {
        throw new Error('Failed to restore backup');
      }

      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      return backup;
    },
  });

  const scheduleAutoBackup = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          return;
        }
      }

      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!settings.autoBackupEnabled) return;

      let trigger: Notifications.NotificationTriggerInput;

      switch (settings.autoBackupFrequency) {
        case 'daily':
          trigger = {
            hour: 2,
            minute: 0,
            repeats: true,
          };
          break;
        case 'weekly':
          trigger = {
            weekday: 1,
            hour: 2,
            minute: 0,
            repeats: true,
          };
          break;
        case 'monthly':
          trigger = {
            day: 1,
            hour: 2,
            minute: 0,
            repeats: true,
          };
          break;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Backup Reminder',
          body: 'Time to backup your loan data',
        },
        trigger,
      });
    } catch (error) {
      console.error('Schedule backup error:', error);
    }
  }, [settings.autoBackupEnabled, settings.autoBackupFrequency]);

  useEffect(() => {
    scheduleAutoBackup();
  }, [scheduleAutoBackup]);

  return {
    settings,
    updateSettings,
    exportBackup: exportBackupMutation.mutateAsync,
    isExportingBackup: exportBackupMutation.isPending,
    importBackup: importBackupMutation.mutateAsync,
    isImportingBackup: importBackupMutation.isPending,
  };
});
