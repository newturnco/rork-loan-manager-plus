import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Building2,
  Users,
  Receipt,
  ShieldCheck,
  RefreshCcw,
  DollarSign,
  ChevronRight,
  FolderOpen,
  Calendar,
  CloudUpload,
  CloudDownload,
  Trash2,
  MessageCircle,
  Bell,
  Crown,
  Home,
  LayoutDashboard,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useAlertSettings } from '@/contexts/AlertSettingsContext';
import { useCurrency, CURRENCIES, Currency } from '@/contexts/CurrencyContext';
import { useBackupSettings } from '@/contexts/BackupSettingsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useModule } from '@/contexts/ModuleContext';
import { LinearGradient } from 'expo-linear-gradient';

const RENT_STORAGE_KEYS = [
  'rent_properties',
  'rent_tenants',
  'rent_agreements',
  'rent_payments',
  'rent_maintenance',
];

type BackupPayload = {
  version: string;
  createdAt: string;
  data: Record<string, unknown>;
};

export default function RentSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const {
    dashboardStats,
    refreshAll,
    clearAll,
  } = useRent();
  const { settings, updateSettings } = useAlertSettings();
  const { currency, updateCurrency } = useCurrency();
  const { settings: backupSettings, updateSettings: updateBackupSettings, performAutoBackup } = useBackupSettings();
  const { subscription, isPremium, isUpgrading } = useSubscription();
  const { selectModule } = useModule();
  const [daysBeforeDue, setDaysBeforeDue] = useState(settings.daysBeforeDue.toString());
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showBackupFrequencyModal, setShowBackupFrequencyModal] = useState(false);
  const [showBackupLocationModal, setShowBackupLocationModal] = useState(false);

  const rentSummary = useMemo(
    () => [
      {
        label: 'Properties',
        value: dashboardStats.totalProperties,
        icon: Building2,
      },
      {
        label: 'Active Tenants',
        value: dashboardStats.activeTenants,
        icon: Users,
      },
      {
        label: 'Monthly Income',
        value: `${currency.symbol}${dashboardStats.monthlyIncome.toFixed(2)}`,
        icon: Receipt,
      },
      {
        label: 'Pending Rent',
        value: `${currency.symbol}${dashboardStats.pendingRent.toFixed(2)}`,
        icon: ShieldCheck,
      },
    ],
    [currency.symbol, dashboardStats],
  );

  const handleBackup = async () => {
    try {
      const entries = await AsyncStorage.multiGet(RENT_STORAGE_KEYS);
      const payload: BackupPayload = {
        version: 'rent-suite-1.0',
        createdAt: new Date().toISOString(),
        data: entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
          acc[key] = value ? JSON.parse(value) : [];
          return acc;
        }, {}),
      };

      const fileName = `RentSuite_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(JSON.stringify(payload, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Rent Backup',
        });
        Alert.alert('Success', 'Backup exported successfully.');
      } else {
        Alert.alert('Success', `Backup saved to ${file.uri}`);
      }
    } catch (error) {
      console.error('[RentSettings] Backup failed', error);
      Alert.alert('Error', 'Unable to create backup right now.');
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
      const content = await file.text();
      const payload = JSON.parse(content) as BackupPayload;

      if (!payload.version || !payload.data) {
        Alert.alert('Invalid file', 'Selected file is not a valid RentSuite backup.');
        return;
      }

      Alert.alert(
        'Restore Data',
        'Restoring will replace existing rent records. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.multiSet(
                  Object.entries(payload.data).map(([key, value]) => [key, JSON.stringify(value)]),
                );
                await refreshAll();
                Alert.alert('Success', 'Rent data restored successfully.');
              } catch (error) {
                console.error('[RentSettings] Restore failed', error);
                Alert.alert('Error', 'Unable to restore rent data.');
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('[RentSettings] Restore picker failed', error);
      Alert.alert('Error', 'Unable to load backup file.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Rent Data',
      'This will remove all properties, tenants, agreements, payments, and maintenance records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll();
              Alert.alert('Success', 'All rent data has been deleted.');
            } catch (error) {
              console.error('[RentSettings] Clear data failed', error);
              Alert.alert('Error', 'Unable to clear rent data.');
            }
          },
        },
      ],
    );
  };

  const handleCurrencySelect = (newCurrency: Currency) => {
    updateCurrency(newCurrency);
    setShowCurrencyModal(false);
    Alert.alert('Currency Updated', `${newCurrency.name} has been set as default.`);
  };

  const handleSwitchToLoan = () => {
    Alert.alert(
      'Switch to Loan Management',
      'Move back into the loan management workspace?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await selectModule('loan');
              router.replace('/(tabs)/loan-dashboard');
            } catch (error) {
              console.error('[RentSettings] Switch module failed', error);
              Alert.alert('Error', 'Unable to switch modules right now.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
          {
            paddingHorizontal: horizontalPadding,
            alignSelf: 'center',
            width: '100%',
            maxWidth: contentMaxWidth,
          },
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
            style={styles.premiumGradient}
          >
            <View style={styles.premiumContent}>
              <Crown color="#FFFFFF" size={32} />
              <View style={styles.premiumTextBlock}>
                <Text style={styles.premiumTitle}>
                  {isPremium ? 'Premium Unlocked' : 'Upgrade to Premium'}
                </Text>
                <Text style={styles.premiumSubtitle}>
                  {isPremium
                    ? subscription.isLifetime
                      ? 'Lifetime access activated'
                      : `Valid until ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'renewal'}`
                    : 'Unlock automation, unlimited records, and analytics'}
                </Text>
              </View>
              {!isPremium && <ChevronRight color="#FFFFFF" size={24} />}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          <View style={styles.statsGrid}>
            {rentSummary.map(({ label, value, icon: Icon }) => (
              <View key={label} style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Icon color={Colors.primary} size={20} />
                </View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency & Region</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setShowCurrencyModal(true)}>
            <View style={styles.selectorLeft}>
              <DollarSign color={Colors.primary} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Primary Currency</Text>
                <Text style={styles.selectorValue}>{currency.name} ({currency.symbol})</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Alerts</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Bell color={Colors.info} size={20} />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Enable Notifications</Text>
                  <Text style={styles.rowSubtitle}>Automated rent reminders</Text>
                </View>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={(value) => updateSettings({ enabled: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={settings.enabled ? Colors.primary : Colors.textSecondary}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Days Before Due</Text>
                  <Text style={styles.rowSubtitle}>Send reminders ahead of due date</Text>
                </View>
              </View>
              <TextInput
                style={styles.numberInput}
                value={daysBeforeDue}
                onChangeText={setDaysBeforeDue}
                onBlur={() => {
                  const days = parseInt(daysBeforeDue, 10) || 0;
                  updateSettings({ daysBeforeDue: days });
                  setDaysBeforeDue(days.toString());
                }}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Due Date Reminder</Text>
                  <Text style={styles.rowSubtitle}>Fire a reminder on rent day</Text>
                </View>
              </View>
              <Switch
                value={settings.onDueDate}
                onValueChange={(value) => updateSettings({ onDueDate: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={settings.onDueDate ? Colors.primary : Colors.textSecondary}
              />
            </View>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Auto WhatsApp Reminders</Text>
                  <Text style={styles.rowSubtitle}>Deliver WhatsApp nudges automatically</Text>
                </View>
              </View>
              <Switch
                value={settings.autoSendWhatsApp}
                onValueChange={(value) => updateSettings({ autoSendWhatsApp: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={settings.autoSendWhatsApp ? Colors.primary : Colors.textSecondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automation & Backups</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <CloudUpload color={Colors.info} size={20} />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Enable Auto Backup</Text>
                  <Text style={styles.rowSubtitle}>Protect rent data automatically</Text>
                </View>
              </View>
              <Switch
                value={backupSettings.enabled}
                onValueChange={(value) => updateBackupSettings({ enabled: value })}
                trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                thumbColor={backupSettings.enabled ? Colors.primary : Colors.textSecondary}
              />
            </View>
            <TouchableOpacity style={styles.row} onPress={() => setShowBackupFrequencyModal(true)}>
              <View style={styles.rowLeft}>
                <Calendar color={Colors.secondary} size={20} />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Backup Frequency</Text>
                  <Text style={styles.rowSubtitle}>{backupSettings.frequency}</Text>
                </View>
              </View>
              <ChevronRight color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} onPress={() => setShowBackupLocationModal(true)}>
              <View style={styles.rowLeft}>
                <FolderOpen color={Colors.warning} size={20} />
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Storage Location</Text>
                  <Text style={styles.rowSubtitle}>
                    {backupSettings.location === 'documents'
                      ? 'Documents'
                      : backupSettings.location === 'downloads'
                        ? 'Downloads'
                        : 'Cache'}
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Last Backup</Text>
                  <Text style={styles.rowSubtitle}>
                    {backupSettings.lastBackupDate
                      ? new Date(backupSettings.lastBackupDate).toLocaleString()
                      : 'Never'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={async () => {
                  const result = await performAutoBackup(true);
                  if (result.success) {
                    Alert.alert('Backup Complete', result.message);
                  } else {
                    Alert.alert('Backup Failed', result.message);
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>Backup Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={handleBackup}>
            <View style={styles.selectorLeft}>
              <CloudDownload color={Colors.info} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Export Rent Data</Text>
                <Text style={styles.selectorValue}>Create a secure backup file</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectorCard} onPress={handleRestore}>
            <View style={styles.selectorLeft}>
              <RefreshCcw color={Colors.secondary} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Restore From Backup</Text>
                <Text style={styles.selectorValue}>Import saved rent history</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => router.push('/message-templates' as never)}>
            <View style={styles.selectorLeft}>
              <MessageCircle color={Colors.success} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Customize Templates</Text>
                <Text style={styles.selectorValue}>Update rent alerts & WhatsApp copy</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Modules</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={handleSwitchToLoan}>
            <View style={styles.selectorLeft}>
              <LayoutDashboard color={Colors.primary} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Loan Management</Text>
                <Text style={styles.selectorValue}>Jump to the loan suite</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <TouchableOpacity style={[styles.selectorCard, styles.dangerCard]} onPress={handleClearData}>
            <View style={styles.selectorLeft}>
              <Trash2 color={Colors.error} size={20} />
              <View>
                <Text style={[styles.selectorLabel, styles.dangerText]}>Clear Rent Records</Text>
                <Text style={[styles.selectorValue, styles.dangerText]}>Remove all stored rent data</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity
            style={styles.selectorCard}
            onPress={() => router.push('/notifications' as never)}
          >
            <View style={styles.selectorLeft}>
              <Home color={Colors.secondary} size={20} />
              <View>
                <Text style={styles.selectorLabel}>Notification Center</Text>
                <Text style={styles.selectorValue}>Review all system updates</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showCurrencyModal} transparent animationType="slide" onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.modalRow, currency.code === item.code && styles.modalRowActive]}
                  onPress={() => handleCurrencySelect(item)}
                >
                  <View>
                    <Text style={styles.modalRowTitle}>{item.name}</Text>
                    <Text style={styles.modalRowSubtitle}>{item.code}</Text>
                  </View>
                  <Text style={styles.modalRowSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupFrequencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackupFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup Frequency</Text>
              <TouchableOpacity onPress={() => setShowBackupFrequencyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {(['daily', 'weekly', 'monthly', 'off'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.modalRow, backupSettings.frequency === option && styles.modalRowActive]}
                onPress={() => {
                  updateBackupSettings({ frequency: option });
                  setShowBackupFrequencyModal(false);
                }}
              >
                <Text style={styles.modalRowTitle}>{option.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackupLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup Location</Text>
              <TouchableOpacity onPress={() => setShowBackupLocationModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {([
              { value: 'documents', label: 'Documents' },
              { value: 'downloads', label: 'Downloads' },
              { value: 'cache', label: 'Cache' },
            ] as const).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalRow, backupSettings.location === option.value && styles.modalRowActive]}
                onPress={() => {
                  updateBackupSettings({ location: option.value });
                  setShowBackupLocationModal(false);
                }}
              >
                <Text style={styles.modalRowTitle}>{option.label}</Text>
              </TouchableOpacity>
            ))}
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
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flexBasis: '47%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectorLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  selectorValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  numberInput: {
    minWidth: 60,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  premiumCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  premiumCardActive: {
    opacity: 0.92,
  },
  premiumGradient: {
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumTextBlock: {
    flex: 1,
    gap: 6,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.error + '50',
  },
  dangerTitle: {
    color: Colors.error,
  },
  dangerText: {
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalRowActive: {
    backgroundColor: Colors.primary + '12',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  modalRowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalRowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalRowSymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
});
