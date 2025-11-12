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
import { Trash2, Info, MessageCircle, HelpCircle, Bell, DollarSign, ChevronRight } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useAlertSettings } from '@/contexts/AlertSettingsContext';
import { useCurrency, CURRENCIES, Currency } from '@/contexts/CurrencyContext';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { loans, installments, payments } = useLoans();
  const { settings, updateSettings } = useAlertSettings();
  const { currency, updateCurrency } = useCurrency();
  const [daysBeforeDue, setDaysBeforeDue] = useState(settings.daysBeforeDue.toString());
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all loans, installments, and payments? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['@loans', '@installments', '@payments']);
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
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
        {icon}
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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>App Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loans.length}</Text>
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
    padding: 16,
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
});
