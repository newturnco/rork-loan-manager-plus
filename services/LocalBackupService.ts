import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

export interface BackupData {
  loans: any[];
  installments: any[];
  payments: any[];
  customers: any[];
  alertSettings: any;
  currency: any;
  timestamp: string;
  version: string;
}

class LocalBackupService {
  async createBackup(): Promise<BackupData> {
    console.log('Creating backup...');
    const loans = await AsyncStorage.getItem('@loans');
    const installments = await AsyncStorage.getItem('@installments');
    const payments = await AsyncStorage.getItem('@payments');
    const customers = await AsyncStorage.getItem('@customers');
    const alertSettings = await AsyncStorage.getItem('@alert_settings');
    const currency = await AsyncStorage.getItem('@currency');

    const backup: BackupData = {
      loans: loans ? JSON.parse(loans) : [],
      installments: installments ? JSON.parse(installments) : [],
      payments: payments ? JSON.parse(payments) : [],
      customers: customers ? JSON.parse(customers) : [],
      alertSettings: alertSettings ? JSON.parse(alertSettings) : null,
      currency: currency ? JSON.parse(currency) : null,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    console.log('Backup created:', backup);
    return backup;
  }

  async restoreBackup(backup: BackupData): Promise<boolean> {
    try {
      console.log('Restoring backup...', backup);
      if (backup.loans) {
        await AsyncStorage.setItem('@loans', JSON.stringify(backup.loans));
      }
      if (backup.installments) {
        await AsyncStorage.setItem('@installments', JSON.stringify(backup.installments));
      }
      if (backup.payments) {
        await AsyncStorage.setItem('@payments', JSON.stringify(backup.payments));
      }
      if (backup.customers) {
        await AsyncStorage.setItem('@customers', JSON.stringify(backup.customers));
      }
      if (backup.alertSettings) {
        await AsyncStorage.setItem('@alert_settings', JSON.stringify(backup.alertSettings));
      }
      if (backup.currency) {
        await AsyncStorage.setItem('@currency', JSON.stringify(backup.currency));
      }

      console.log('Backup restored successfully');
      return true;
    } catch (error) {
      console.error('Restore backup error:', error);
      return false;
    }
  }

  async exportBackupToFile(): Promise<string | null> {
    try {
      console.log('Exporting backup to file...');
      const backup = await this.createBackup();
      const fileName = `loan_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(backup, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Backup exported successfully on web');
        return fileName;
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, fileContent);
        console.log('Backup saved to:', fileUri);
        
        if (Platform.OS === 'android') {
          try {
            const { StorageAccessFramework } = FileSystem;
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const uri = await StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/json'
              );
              await FileSystem.writeAsStringAsync(uri, fileContent);
              console.log('Backup saved to storage:', uri);
              if (Platform.OS !== 'web') {
                Alert.alert('Backup Saved', 'Your backup has been saved successfully.');
              }
              return uri;
            }
          } catch (error) {
            console.log('Android storage access error:', error);
          }
        }
        
        if (Platform.OS === 'ios') {
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Backup Created',
              'Your backup file has been created. You can find it in the app\'s documents folder.',
              [{ text: 'OK' }]
            );
          }
        }
        
        return fileUri;
      }
    } catch (error) {
      console.error('Export backup error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to export backup. Please try again.');
      }
      return null;
    }
  }

  async importBackupFromFile(): Promise<BackupData | null> {
    try {
      console.log('Importing backup from file...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        console.log('Import cancelled by user');
        return null;
      }

      const fileUri = result.assets[0].uri;
      console.log('Reading backup from:', fileUri);

      let fileContent: string;
      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        fileContent = await response.text();
      } else {
        fileContent = await FileSystem.readAsStringAsync(fileUri);
      }

      const backup = JSON.parse(fileContent) as BackupData;
      console.log('Backup imported successfully:', backup);
      return backup;
    } catch (error) {
      console.error('Import backup error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to import backup. Please make sure you selected a valid backup file.');
      }
      return null;
    }
  }
}

export default new LocalBackupService();
