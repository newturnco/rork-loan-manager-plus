# Backup & Restore Guide

## Overview

The app now includes a comprehensive local-only data storage system with Google Drive backup/restore capabilities. All data is stored locally on the device using AsyncStorage, and you can optionally backup to Google Drive or export/import backup files.

## Features

### 1. **Local Storage**
- All data (loans, payments, installments, customers) is stored locally on your device
- No backend server required
- Data persists across app restarts
- Fast and secure

### 2. **Manual Backup**
- Create backups on-demand from Settings
- Backups include:
  - All loans
  - All installments
  - All payments
  - All customers
  - Alert settings
  - Currency preferences

### 3. **Export to File**
- Export backup as a JSON file
- On mobile: Saves to device's document directory
- On web: Downloads directly to your computer
- Easy to share or store externally

### 4. **Import from File**
- Restore data from a previously exported backup file
- Select backup file using system picker
- All current data will be replaced with backup data

### 5. **Google Drive Backup** (Optional)
- Automatically backup to Google Drive
- Scheduled backups: Daily, Weekly, or Monthly
- Secure OAuth 2.0 authentication
- List and restore from previous backups

### 6. **Automatic Backup Scheduling**
- Enable auto-backup in Settings
- Choose frequency: Daily, Weekly, or Monthly
- Receive notifications when backup is due
- Works seamlessly in the background

## How to Use

### Setting Up Google Drive Backup

1. **Get Google Cloud OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add your app's redirect URI: `loanmanager://auth`
   - Copy the Client ID

2. **Connect Google Drive:**
   - Open Settings tab
   - Scroll to "Backup & Restore" section
   - Tap "Connect" under Google Drive Backup
   - Enter your Google Client ID
   - Tap "Connect"
   - Authorize the app in your browser

3. **Configure Auto Backup:**
   - Toggle "Auto Backup" switch
   - Select frequency (Daily/Weekly/Monthly)
   - Backups will run automatically

### Manual Backup & Restore

#### Create Manual Backup
1. Go to Settings tab
2. Scroll to "Backup & Restore"
3. Tap "Create Backup"
4. Backup is created (and uploaded to Google Drive if connected)

#### Export Backup to File
1. Go to Settings tab
2. Tap "Export Backup"
3. File is saved to your device/downloads folder

#### Import Backup from File
1. Go to Settings tab
2. Tap "Import Backup"
3. Select backup file from your device
4. Confirm restoration
5. All data is restored from the backup

### Restore from Google Drive
1. Ensure Google Drive is connected
2. Go to Settings tab
3. Tap on Google Drive backup options
4. Select backup to restore from
5. Confirm restoration

## Backup File Format

Backup files are in JSON format with the following structure:

```json
{
  "version": "1.0",
  "timestamp": "2025-01-12T10:30:00.000Z",
  "loans": [...],
  "installments": [...],
  "payments": [...],
  "customers": [...],
  "alertSettings": {...},
  "currency": {...}
}
```

## Security Notes

- All local data is stored in AsyncStorage (encrypted on device)
- Google Drive backups are stored in your private app data folder
- OAuth tokens are securely stored
- No data is sent to any third-party servers except Google Drive (if enabled)

## Troubleshooting

### Google Drive Connection Fails
- Verify your Client ID is correct
- Ensure redirect URI is properly configured in Google Cloud Console
- Check internet connection
- Try disconnecting and reconnecting

### Backup File Not Opening
- Ensure file is a valid JSON format
- Check file was not corrupted during transfer
- Try exporting a fresh backup and comparing

### Auto Backup Not Working
- Enable notifications permission
- Check auto-backup is enabled in settings
- Verify Google Drive connection (if using)
- Ensure app has background permissions

## Best Practices

1. **Regular Backups**: Enable auto-backup weekly or monthly
2. **External Storage**: Export and save backups to external storage periodically
3. **Before Major Changes**: Create manual backup before clearing data or major updates
4. **Test Restore**: Periodically test backup restore on a test device
5. **Multiple Locations**: Keep backups in multiple places (Google Drive + local file)

## Support

For issues or questions about backup/restore functionality, please contact support or refer to the main app documentation.
