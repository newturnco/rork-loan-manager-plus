import { File, Directory, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const TOKEN_KEY = '@google_drive_token';

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

export interface GoogleDriveToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

class GoogleDriveService {
  private clientId = '';
  private clientSecret = '';

  async init(clientId: string, clientSecret: string = '') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.clientId) {
        throw new Error('Google Drive client ID not configured');
      }

      const redirectUri = makeRedirectUri({
        scheme: 'loanmanager',
        path: 'auth',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(GOOGLE_DRIVE_SCOPE)}&access_type=offline&prompt=consent`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: this.clientId,
              client_secret: this.clientSecret,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }).toString(),
          });

          const tokenData = await tokenResponse.json();

          if (tokenData.access_token) {
            const token: GoogleDriveToken = {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              expiresAt: Date.now() + (tokenData.expires_in * 1000),
            };

            await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const tokenStr = await AsyncStorage.getItem(TOKEN_KEY);
      if (!tokenStr) return false;

      const token: GoogleDriveToken = JSON.parse(tokenStr);
      return Date.now() < token.expiresAt;
    } catch {
      return false;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const tokenStr = await AsyncStorage.getItem(TOKEN_KEY);
      if (!tokenStr) return null;

      const token: GoogleDriveToken = JSON.parse(tokenStr);

      if (Date.now() >= token.expiresAt) {
        if (token.refreshToken) {
          const refreshed = await this.refreshAccessToken(token.refreshToken);
          if (refreshed) return refreshed;
        }
        return null;
      }

      return token.accessToken;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        }).toString(),
      });

      const data = await response.json();

      if (data.access_token) {
        const token: GoogleDriveToken = {
          accessToken: data.access_token,
          refreshToken,
          expiresAt: Date.now() + (data.expires_in * 1000),
        };

        await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
        return data.access_token;
      }

      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  async createBackup(): Promise<BackupData> {
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

    return backup;
  }

  async uploadBackup(backup: BackupData): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const fileName = `loan_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileContent = JSON.stringify(backup, null, 2);

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: ['appDataFolder'],
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Upload backup error:', error);
      return false;
    }
  }

  async listBackups(): Promise<{ id: string; name: string; createdTime: string }[]> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return [];

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?spaces=appDataFolder&q=name contains 'loan_manager_backup'&orderBy=createdTime desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('List backups error:', error);
      return [];
    }
  }

  async downloadBackup(fileId: string): Promise<BackupData | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      return data as BackupData;
    } catch (error) {
      console.error('Download backup error:', error);
      return null;
    }
  }

  async restoreBackup(backup: BackupData): Promise<boolean> {
    try {
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

      return true;
    } catch (error) {
      console.error('Restore backup error:', error);
      return false;
    }
  }

  async exportBackupToFile(): Promise<string | null> {
    try {
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
        return fileName;
      } else {
        const file = new File(Paths.document, fileName);
        file.create();
        file.write(fileContent);
        return file.uri;
      }
    } catch (error) {
      console.error('Export backup error:', error);
      return null;
    }
  }

  async importBackupFromFile(): Promise<BackupData | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const fileUri = result.assets[0].uri;

      if (Platform.OS === 'web') {
        const response = await fetch(fileUri);
        const text = await response.text();
        return JSON.parse(text);
      } else {
        const file = new File(fileUri);
        const fileContent = await file.text();
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Import backup error:', error);
      return null;
    }
  }
}

export default new GoogleDriveService();
