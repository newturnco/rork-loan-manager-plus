import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'off';
export type BackupLocation = 'documents' | 'downloads' | 'cache';

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastBackupDate: string | null;
  autoShare: boolean;
  location: BackupLocation;
}

const BACKUP_SETTINGS_KEY = '@backupSettings';

const defaultSettings: BackupSettings = {
  enabled: false,
  frequency: 'weekly',
  lastBackupDate: null,
  autoShare: false,
  location: 'documents',
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

  const getBackupPath = useCallback((location: BackupLocation) => {
    switch (location) {
      case 'documents':
        return Paths.document;
      case 'downloads':
        return Paths.document;
      case 'cache':
        return Paths.cache;
      default:
        return Paths.document;
    }
  }, []);

  const performAutoBackup = useCallback(async (forceBackup?: boolean) => {
    try {
      if (!forceBackup) {
        const shouldBackup = await checkAndPerformBackup();
        
        if (!shouldBackup) {
          return { success: false, message: 'Backup not due yet' };
        }
      }

      const loans = await AsyncStorage.getItem('@loans');
      const installments = await AsyncStorage.getItem('@installments');
      const payments = await AsyncStorage.getItem('@payments');
      const customers = await AsyncStorage.getItem('@customers');
      const currencyData = await AsyncStorage.getItem('@currency');
      const alertSettings = await AsyncStorage.getItem('@alertSettings');
      const messageTemplates = await AsyncStorage.getItem('@messageTemplates');

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: forceBackup ? 'manual' : 'automatic',
        data: {
          loans: loans ? JSON.parse(loans) : [],
          installments: installments ? JSON.parse(installments) : [],
          payments: payments ? JSON.parse(payments) : [],
          customers: customers ? JSON.parse(customers) : [],
          currency: currencyData ? JSON.parse(currencyData) : null,
          alertSettings: alertSettings ? JSON.parse(alertSettings) : null,
          messageTemplates: messageTemplates ? JSON.parse(messageTemplates) : null,
        },
      };

      const fileName = `LendTrack_${forceBackup ? 'Manual' : 'Auto'}Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      const backupPath = getBackupPath(settings.location);
      const file = new File(backupPath, fileName);
      
      await file.write(JSON.stringify(backup, null, 2));

      updateSettings({ lastBackupDate: new Date().toISOString() });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare && (settings.autoShare || forceBackup)) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: forceBackup ? 'Manual Backup' : 'Automatic Backup',
          UTI: 'public.json',
        });
      }

      return { success: true, message: 'Backup completed successfully', fileUri: file.uri };
    } catch (error) {
      console.error('Error performing backup:', error);
      return { success: false, message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error };
    }
  }, [settings, checkAndPerformBackup, updateSettings, getBackupPath]);

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
    getBackupPath,
    isLoading: settingsQuery.isLoading,
  };
});
