import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trash2, Info, MessageCircle, HelpCircle, Bell, DollarSign, ChevronRight, Download, Upload, Clock, Calendar as CalendarIcon, Crown, FolderOpen, FileText, RefreshCw } from 'lucide-react-native';
import { useLoans } from '../../contexts/LoanContext';
import { useAlertSettings } from '../../contexts/AlertSettingsContext';
import { useCurrency, CURRENCIES, Currency } from '../../contexts/CurrencyContext';
import { useBackupSettings } from '../../contexts/BackupSettingsContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsive } from '../../utils/responsive';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useModule } from '@/contexts/ModuleContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { loans, installments, payments } = useLoans();
  const { customers } = useCustomers();
  const { settings, updateSettings } = useAlertSettings();
  const { currency, updateCurrency } = useCurrency();
  const { subscription, isPremium, features, isUpgrading } = useSubscription();
  const queryClient = useQueryClient();
  const { settings: backupSettings, updateSettings: updateBackupSettings, performAutoBackup } = useBackupSettings();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { resetModule } = useModule();
  const [daysBeforeDue, setDaysBeforeDue] = useState(settings.daysBeforeDue.toString());
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showBackupFrequencyModal, setShowBackupFrequencyModal] = useState(false);
  const [showBackupLocationModal, setShowBackupLocationModal] = useState(false);

  const handleBackup = async () => {
    try {
      const loans = await AsyncStorage.getItem('@loans');
      const installments = await AsyncStorage.getItem('@installments');
      const payments = await AsyncStorage.getItem('@payments');
      const customers = await AsyncStorage.getItem('@customers');
      const currencyData = await AsyncStorage.getItem('@currency');
      const alertSettings = await AsyncStorage.getItem('@alertSettings');

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          loans: loans ? JSON.parse(loans) : [],
          installments: installments ? JSON.parse(installments) : [],
          payments: payments ? JSON.parse(payments) : [],
          customers: customers ? JSON.parse(customers) : [],
          currency: currencyData ? JSON.parse(currencyData) : null,
          alertSettings: alertSettings ? JSON.parse(alertSettings) : null,
        },
      };

      const fileName = `LendTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(JSON.stringify(backup, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Backup File',
          UTI: 'public.json',
        });
        Alert.alert('Success', 'Backup created successfully!');
      } else {
        Alert.alert('Success', `Backup saved to: ${file.uri}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = new File(result.assets[0].uri);
      const fileContent = await file.text();
      const backup = JSON.parse(fileContent);

      if (!backup.version || !backup.data) {
        Alert.alert('Error', 'Invalid backup file format');
        return;
      }

      Alert.alert(
        'Restore Backup',
        `This will restore data from ${new Date(backup.timestamp).toLocaleDateString()}. All current data will be replaced. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                if (backup.data.loans) {
                  await AsyncStorage.setItem('@loans', JSON.stringify(backup.data.loans));
                }
                if (backup.data.installments) {
                  await AsyncStorage.setItem('@installments', JSON.stringify(backup.data.installments));
                }
                if (backup.data.payments) {
                  await AsyncStorage.setItem('@payments', JSON.stringify(backup.data.payments));
                }
                if (backup.data.customers) {
                  await AsyncStorage.setItem('@customers', JSON.stringify(backup.data.customers));
                }
                if (backup.data.currency) {
                  await AsyncStorage.setItem('@currency', JSON.stringify(backup.data.currency));
                }
                if (backup.data.alertSettings) {
                  await AsyncStorage.setItem('@alertSettings', JSON.stringify(backup.data.alertSettings));
                }

                queryClient.invalidateQueries({ queryKey: ['loans'] });
                queryClient.invalidateQueries({ queryKey: ['installments'] });
                queryClient.invalidateQueries({ queryKey: ['payments'] });
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['currency'] });
                queryClient.invalidateQueries({ queryKey: ['alertSettings'] });

                Alert.alert('Success', 'Data restored successfully!', [
                  { text: 'OK' },
                ]);
              } catch (error) {
                console.error('Error restoring backup:', error);
                Alert.alert('Error', 'Failed to restore backup');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error reading backup file:', error);
      Alert.alert('Error', 'Failed to read backup file');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all loans, installments, payments, and customers? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Settings] Clearing all data...');
              await AsyncStorage.multiRemove(['@loans', '@installments', '@payments', '@customers']);
              console.log('[Settings] AsyncStorage cleared');
              
              queryClient.invalidateQueries({ queryKey: ['loans'] });
              queryClient.invalidateQueries({ queryKey: ['installments'] });
              queryClient.invalidateQueries({ queryKey: ['payments'] });
              queryClient.invalidateQueries({ queryKey: ['customers'] });
              console.log('[Settings] Query cache invalidated');
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('[Settings] Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleCurrencySelect = (newCurrency: Currency) => {
    updateCurrency(newCurrency);
    setShowCurrencyModal(false);
    Alert.alert('Success', `Currency changed to ${newCurrency.name}`);
  };

  const handleSwitchModule = () => {
    Alert.alert(
      'Switch Module',
      'Select which experience you want to manage next.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              console.log('[Settings] Switching management module');
              await resetModule();
              router.replace('/module-selection');
            } catch (error) {
              console.error('[Settings] Failed to switch module', error);
              Alert.alert('Error', 'Unable to switch module right now. Please try again.');
            }
          },
        },
      ],
    );
  };

  const SettingCard = ({
    icon,
    title,
    subtitle,
    onPress,
    danger,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingCard, danger && styles.dangerCard]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, danger && styles.dangerIcon]}>
        {React.isValidElement(icon) ? icon : null}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth },
        ]}
      >
        <TouchableOpacity 
          style={[styles.premiumCard, isPremium && styles.premiumCardActive]}
          onPress={() => !isPremium && router.push('/paywall')}
          disabled={isUpgrading}
        >
          <LinearGradient
            colors={isPremium ? [Colors.warning, Colors.warning + 'DD'] : [Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumCardGradient}
          >
            <View style={styles.premiumCardContent}>
              <Crown color="#FFFFFF" size={32} />
              <View style={styles.premiumCardText}>
                <Text style={styles.premiumCardTitle}>
                  {isPremium ? "Premium Active" : "Upgrade to Premium"}
                </Text>
                <Text style={styles.premiumCardSubtitle}>
                  {isPremium 
                    ? subscription.isLifetime 
                      ? "Lifetime Access" 
                      : `Expires ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Never'}`
                    : "Unlock all features and unlimited access"
                  }
                </Text>
              </View>
              {!isPremium && <ChevronRight color="#FFFFFF" size={24} />}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Usage Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loans.length}{features.maxLoans ? ` / ${features.maxLoans}` : ''}
              </Text>
              <Text style={styles.statLabel}>Total Loans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{installments.length}</Text>
              <Text style={styles.statLabel}>Installments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{payments.length}</Text>
              <Text style={styles.statLabel}>Payments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {customers.length}{features.maxCustomers ? ` / ${features.maxCustomers}` : ''}
              </Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency Settings</Text>
          
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <DollarSign color={Colors.primary} size={20} />
              <View>
                <Text style={styles.currencyLabel}>Currency</Text>
                <Text style={styles.currencyValue}>{currency.name} ({currency.symbol})</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Bell color={Colors.info} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Enable Alerts</Text>
                  <Text style={styles.settingDescription}>Receive payment reminders</Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                thumbColor={settings.enabled ? Colors.primary : Colors.textSecondary}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Days Before Due</Text>
                  <Text style={styles.settingDescription}>Alert before payment due</Text>
                </View>
              </View>
              <TextInput
                style={styles.numberInput}
                value={daysBeforeDue}
                onChangeText={setDaysBeforeDue}
                onBlur={() => {
                  const days = parseInt(daysBeforeDue) || 0;
                  updateSettings({ daysBeforeDue: days });
                }}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Alert on Due Date</Text>
                  <Text style={styles.settingDescription}>Send alert on payment day</Text>
                </View>
              </View>
              <Switch
                value={settings.onDueDate}
                onValueChange={(value) => updateSettings({ onDueDate: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                thumbColor={settings.onDueDate ? Colors.primary : Colors.textSecondary}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto WhatsApp Reminders</Text>
                  <Text style={styles.settingDescription}>Automatically send reminders</Text>
                </View>
              </View>
              <Switch
                value={settings.autoSendWhatsApp}
                onValueChange={(value) => updateSettings({ autoSendWhatsApp: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                thumbColor={settings.autoSendWhatsApp ? Colors.primary : Colors.textSecondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingCard
            icon={<Info color={Colors.info} size={24} />}
            title="App Information"
            subtitle="LendTrack Pro v1.0.0"
            onPress={() => {
              Alert.alert(
                'LendTrack Pro',
                'A comprehensive money lending app with interest rate calculation, installment tracking, and reporting features.\n\nVersion 1.0.0\n\nBuilt with React Native & Expo'
              );
            }}
          />
          <SettingCard
            icon={<HelpCircle color={Colors.secondary} size={24} />}
            title="Help & Support"
            subtitle="Get help with using the app"
            onPress={() => {
              Alert.alert(
                'Help & Support',
                'For help and support:\n\n• Check out the app features in each tab\n• Use the WhatsApp notification feature to send payment reminders\n• Export reports for detailed analytics\n\nContact: support@lendtrack.com'
              );
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automatic Backups</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Clock color={Colors.info} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Enable Auto Backup</Text>
                  <Text style={styles.settingDescription}>Periodic automatic backups</Text>
                </View>
              </View>
              <Switch
                value={backupSettings.enabled}
                onValueChange={(value) => updateBackupSettings({ enabled: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
                thumbColor={backupSettings.enabled ? Colors.primary : Colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowBackupFrequencyModal(true)}
            >
              <View style={styles.settingLeft}>
                <CalendarIcon color={Colors.secondary} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Backup Frequency</Text>
                  <Text style={styles.settingDescription}>{backupSettings.frequency}</Text>
                </View>
              </View>
              <ChevronRight color={Colors.textSecondary} size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowBackupLocationModal(true)}
            >
              <View style={styles.settingLeft}>
                <FolderOpen color={Colors.warning} size={20} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Backup Location</Text>
                  <Text style={styles.settingDescription}>
                    {backupSettings.location === 'documents' ? 'Documents' : backupSettings.location === 'downloads' ? 'Downloads' : 'Cache'}
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textSecondary} size={20} />
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Last Backup</Text>
                  <Text style={styles.settingDescription}>
                    {backupSettings.lastBackupDate
                      ? new Date(backupSettings.lastBackupDate).toLocaleDateString()
                      : 'Never'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  const result = await performAutoBackup(true);
                  if (result.success) {
                    Alert.alert('Success', result.message);
                  } else {
                    Alert.alert('Error', result.message);
                  }
                }}
                style={styles.manualBackupButton}
              >
                <Text style={styles.manualBackupButtonText}>Backup Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <SettingCard
            icon={<Download color={Colors.info} size={24} />}
            title="Backup Data"
            subtitle="Export all data to a file"
            onPress={handleBackup}
          />
          <SettingCard
            icon={<Upload color={Colors.secondary} size={24} />}
            title="Restore Data"
            subtitle="Import data from backup file"
            onPress={handleRestore}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Templates</Text>
          <SettingCard
            icon={<FileText color={Colors.info} size={24} />}
            title="Customize Messages"
            subtitle="Edit payment reminders and alert messages"
            onPress={() => {
              router.push('/message-templates' as any);
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Module Selection</Text>
          <SettingCard
            icon={<RefreshCw color={Colors.secondary} size={24} />}
            title="Switch Module"
            subtitle="Jump between Loan and Rent dashboards"
            onPress={handleSwitchModule}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <SettingCard
            icon={<MessageCircle color={Colors.success} size={24} />}
            title="WhatsApp Support"
            subtitle="Contact us via WhatsApp"
            onPress={() => {
              Linking.openURL('https://wa.me/?text=Hello, I need help with LendTrack Pro');
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>
            Danger Zone
          </Text>
          <SettingCard
            icon={<Trash2 color={Colors.error} size={24} />}
            title="Clear All Data"
            subtitle="Permanently delete all loans and payments"
            onPress={handleClearData}
            danger
          />
        </View>
      </ScrollView>

      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    currency.code === curr.code && styles.currencyItemSelected,
                  ]}
                  onPress={() => handleCurrencySelect(curr)}
                >
                  <View>
                    <Text style={styles.currencyItemName}>{curr.name}</Text>
                    <Text style={styles.currencyItemCode}>{curr.code}</Text>
                  </View>
                  <Text style={styles.currencyItemSymbol}>{curr.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupFrequencyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBackupFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Backup Frequency</Text>
              <TouchableOpacity onPress={() => setShowBackupFrequencyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View>
              {(['daily', 'weekly', 'monthly', 'off'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.currencyItem,
                    backupSettings.frequency === freq && styles.currencyItemSelected,
                  ]}
                  onPress={() => {
                    updateBackupSettings({ frequency: freq });
                    setShowBackupFrequencyModal(false);
                  }}
                >
                  <Text style={styles.currencyItemName}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBackupLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Backup Location</Text>
              <TouchableOpacity onPress={() => setShowBackupLocationModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View>
              {([{value: 'documents', label: 'Documents'}, {value: 'downloads', label: 'Downloads'}, {value: 'cache', label: 'Cache'}] as const).map((loc) => (
                <TouchableOpacity
                  key={loc.value}
                  style={[
                    styles.currencyItem,
                    backupSettings.location === loc.value && styles.currencyItemSelected,
                  ]}
                  onPress={() => {
                    updateBackupSettings({ location: loc.value });
                    setShowBackupLocationModal(false);
                  }}
                >
                  <Text style={styles.currencyItemName}>{loc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  statsSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currencySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dangerIcon: {
    backgroundColor: Colors.error + '15',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  dangerText: {
    color: Colors.error,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  numberInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 60,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyItemSelected: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  currencyItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  currencyItemCode: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currencyItemSymbol: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  manualBackupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manualBackupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  premiumCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumCardActive: {
    opacity: 0.9,
  },
  premiumCardGradient: {
    padding: 20,
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumCardText: {
    flex: 1,
  },
  premiumCardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  premiumCardSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
