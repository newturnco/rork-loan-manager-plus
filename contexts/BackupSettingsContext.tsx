import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'off';

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastBackupDate: string | null;
  autoShare: boolean;
}

const BACKUP_SETTINGS_KEY = '@backupSettings';

const defaultSettings: BackupSettings = {
  enabled: false,
  frequency: 'weekly',
  lastBackupDate: null,
  autoShare: false,
};

export const [BackupSettingsProvider, useBackupSettings] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings);

  const settingsQuery = useQuery({
    queryKey: ['backupSettings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BACKUP_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
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
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
    },
  });

  const { mutate: saveSettings } = saveSettingsMutation;

  const updateSettings = useCallback((updates: Partial<BackupSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const checkAndPerformBackup = useCallback(async () => {
    if (!settings.enabled || settings.frequency === 'off') {
      return false;
    }

    const now = new Date();
    const lastBackup = settings.lastBackupDate ? new Date(settings.lastBackupDate) : null;

    if (!lastBackup) {
      return true;
    }

    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

    switch (settings.frequency) {
      case 'daily':
        return daysSinceLastBackup >= 1;
      case 'weekly':
        return daysSinceLastBackup >= 7;
      case 'monthly':
        return daysSinceLastBackup >= 30;
      default:
        return false;
    }
  }, [settings]);

  const performAutoBackup = useCallback(async () => {
    try {
      const shouldBackup = await checkAndPerformBackup();
      
      if (!shouldBackup) {
        return { success: false, message: 'Backup not due yet' };
      }

      const loans = await AsyncStorage.getItem('@loans');
      const installments = await AsyncStorage.getItem('@installments');
      const payments = await AsyncStorage.getItem('@payments');
      const customers = await AsyncStorage.getItem('@customers');
      const currencyData = await AsyncStorage.getItem('@currency');
      const alertSettings = await AsyncStorage.getItem('@alertSettings');

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: 'automatic',
        data: {
          loans: loans ? JSON.parse(loans) : [],
          installments: installments ? JSON.parse(installments) : [],
          payments: payments ? JSON.parse(payments) : [],
          customers: customers ? JSON.parse(customers) : [],
          currency: currencyData ? JSON.parse(currencyData) : null,
          alertSettings: alertSettings ? JSON.parse(alertSettings) : null,
        },
      };

      const fileName = `LendTrack_AutoBackup_${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(JSON.stringify(backup, null, 2));

      updateSettings({ lastBackupDate: new Date().toISOString() });

      if (settings.autoShare) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Automatic Backup',
            UTI: 'public.json',
          });
        }
      }

      return { success: true, message: 'Automatic backup completed', fileUri: file.uri };
    } catch (error) {
      console.error('Error performing automatic backup:', error);
      return { success: false, message: 'Backup failed', error };
    }
  }, [settings, checkAndPerformBackup, updateSettings]);

  useEffect(() => {
    if (settings.enabled) {
      const checkBackup = async () => {
        const result = await performAutoBackup();
        if (result.success) {
          console.log('Automatic backup completed:', result.message);
        }
      };
      
      checkBackup();
      
      const interval = setInterval(checkBackup, 1000 * 60 * 60);
      
      return () => clearInterval(interval);
    }
  }, [settings.enabled, settings.frequency, performAutoBackup]);

  return {
    settings,
    updateSettings,
    performAutoBackup,
    checkAndPerformBackup,
    isLoading: settingsQuery.isLoading,
  };
});
