import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { RentFrequency } from '@/types/rent';
import { useResponsive } from '@/utils/responsive';
import DatePicker from '@/components/DatePicker';

const RENT_FREQUENCIES: { label: string; value: RentFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function AddRentAgreementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { properties, tenants, addAgreement } = useRent();

  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = React.useState<string>('');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');
  const [rentAmount, setRentAmount] = React.useState<string>('');
  const [deposit, setDeposit] = React.useState<string>('');
  const [maintenance, setMaintenance] = React.useState<string>('');
  const [frequency, setFrequency] = React.useState<RentFrequency>('monthly');
  const [dueDay, setDueDay] = React.useState<string>('1');
  const [autoRenewal, setAutoRenewal] = React.useState<boolean>(true);
  const [noticePeriod, setNoticePeriod] = React.useState<string>('30');
  const [terms, setTerms] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const handleSubmit = React.useCallback(async () => {
    if (!selectedPropertyId || !selectedTenantId) {
      Alert.alert('Missing selection', 'Please select both property and tenant.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Missing dates', 'Select agreement start and end dates.');
      return;
    }
    if (!rentAmount || Number.isNaN(Number(rentAmount))) {
      Alert.alert('Invalid rent', 'Enter a valid rent amount.');
      return;
    }
    const dayValue = Number(dueDay);
    if (Number.isNaN(dayValue) || dayValue < 1 || dayValue > 31) {
      Alert.alert('Invalid due day', 'Payment due day must be between 1 and 31.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        addAgreement({
          propertyId: selectedPropertyId,
          tenantId: selectedTenantId,
          startDate,
          endDate,
          rentAmount: Number(rentAmount),
          securityDeposit: deposit ? Number(deposit) : 0,
          maintenanceCharges: maintenance ? Number(maintenance) : undefined,
          rentFrequency: frequency,
          paymentDueDay: dayValue,
          status: 'active',
          terms: terms.trim() || undefined,
          autoRenewal,
          noticePeriod: noticePeriod ? Number(noticePeriod) : undefined,
          documents: [],
        }),
      );
      Alert.alert('Agreement created', 'Rent agreement saved successfully.', [
        {
          text: 'Record Payment',
          onPress: () => router.replace('/record-rent-payment'),
        },
        {
          text: 'Done',
          style: 'cancel',
          onPress: () => router.replace('/(rent-tabs)/rent-tenants'),
        },
      ]);
    } catch (error) {
      console.error('[AddRentAgreement] Failed to create agreement', error);
      Alert.alert('Error', 'Unable to create agreement right now.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addAgreement,
    autoRenewal,
    deposit,
    endDate,
    frequency,
    maintenance,
    noticePeriod,
    rentAmount,
    router,
    selectedPropertyId,
    selectedTenantId,
    startDate,
    terms,
    dueDay,
  ]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      edges={['bottom']}
      testID="add-rent-agreement-screen"
    >
      <Stack.Screen
        options={{
          title: 'New Rent Agreement',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>Select Property</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {properties.map((property) => {
              const isActive = property.id === selectedPropertyId;
              return (
                <TouchableOpacity
                  key={property.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedPropertyId(property.id)}
                  activeOpacity={0.85}
                  testID={`agreement-property-${property.id}`}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{property.name}</Text>
                  <Text style={[styles.chipSubText, isActive && styles.chipTextActive]}>{property.city}</Text>
                </TouchableOpacity>
              );
            })}
            {properties.length === 0 && (
              <Text style={styles.emptyHelper}>Add a property first to link this agreement.</Text>
            )}
          </ScrollView>

          <Text style={styles.sectionLabel}>Select Tenant</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {tenants.map((tenant) => {
              const isActive = tenant.id === selectedTenantId;
              return (
                <TouchableOpacity
                  key={tenant.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedTenantId(tenant.id)}
                  activeOpacity={0.85}
                  testID={`agreement-tenant-${tenant.id}`}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tenant.name}</Text>
                  <Text style={[styles.chipSubText, isActive && styles.chipTextActive]}>{tenant.phone}</Text>
                </TouchableOpacity>
              );
            })}
            {tenants.length === 0 && (
              <Text style={styles.emptyHelper}>Add a tenant profile to continue.</Text>
            )}
          </ScrollView>

          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.rowInputs}>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              label="Start Date"
              testID="agreement-start-date"
            />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              label="End Date"
              testID="agreement-end-date"
            />
          </View>

          <Text style={styles.sectionLabel}>Financials</Text>
          <TextInput
            style={styles.input}
            placeholder="Monthly Rent"
            placeholderTextColor={Colors.textSecondary}
            value={rentAmount}
            onChangeText={setRentAmount}
            keyboardType="numeric"
            testID="agreement-rent-input"
          />
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Security Deposit"
              placeholderTextColor={Colors.textSecondary}
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="numeric"
              testID="agreement-deposit-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Maintenance Charges"
              placeholderTextColor={Colors.textSecondary}
              value={maintenance}
              onChangeText={setMaintenance}
              keyboardType="numeric"
              testID="agreement-maintenance-input"
            />
          </View>

          <Text style={styles.sectionLabel}>Billing Cycle</Text>
          <View style={styles.frequencyRow}>
            {RENT_FREQUENCIES.map((option) => {
              const isActive = option.value === frequency;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.frequencyChip, isActive && styles.frequencyChipActive]}
                  onPress={() => setFrequency(option.value)}
                  activeOpacity={0.85}
                  testID={`agreement-frequency-${option.value}`}
                >
                  <Text style={[styles.frequencyText, isActive && styles.frequencyTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Due Day (1-31)"
              placeholderTextColor={Colors.textSecondary}
              value={dueDay}
              onChangeText={setDueDay}
              keyboardType="numeric"
              testID="agreement-due-day-input"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              placeholder="Notice Period (days)"
              placeholderTextColor={Colors.textSecondary}
              value={noticePeriod}
              onChangeText={setNoticePeriod}
              keyboardType="numeric"
              testID="agreement-notice-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.toggle, autoRenewal && styles.toggleActive]}
            onPress={() => setAutoRenewal((prev) => !prev)}
            activeOpacity={0.85}
            testID="agreement-autorenewal-toggle"
          >
            <Text style={[styles.toggleLabel, autoRenewal && styles.toggleLabelActive]}>Auto Renew Agreement</Text>
            <Text style={[styles.toggleHint, autoRenewal && styles.toggleLabelActive]}>
              {autoRenewal ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Key Terms & Conditions"
            placeholderTextColor={Colors.textSecondary}
            value={terms}
            onChangeText={setTerms}
            multiline
            numberOfLines={4}
            testID="agreement-terms-input"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || properties.length === 0 || tenants.length === 0}
            testID="agreement-submit-button"
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Create Agreement'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    gap: 18,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 140,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chipSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  emptyHelper: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingVertical: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top' as const,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  frequencyChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  frequencyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  frequencyTextActive: {
    color: '#FFFFFF',
  },
  toggle: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleLabelActive: {
    color: '#FFFFFF',
  },
  toggleHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});