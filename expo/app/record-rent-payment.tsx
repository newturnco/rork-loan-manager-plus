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
import { RentPaymentStatus } from '@/types/rent';
import { useResponsive } from '@/utils/responsive';
import DatePicker from '@/components/DatePicker';

const PAYMENT_STATUSES: { label: string; value: RentPaymentStatus }[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Partial', value: 'partial' },
];

export default function RecordRentPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { agreements, properties, tenants, addPayment } = useRent();

  const [selectedAgreementId, setSelectedAgreementId] = React.useState<string>('');
  const [dueDate, setDueDate] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');
  const [paidAmount, setPaidAmount] = React.useState<string>('');
  const [status, setStatus] = React.useState<RentPaymentStatus>('pending');
  const [paymentDate, setPaymentDate] = React.useState<string>('');
  const [lateFee, setLateFee] = React.useState<string>('');
  const [method, setMethod] = React.useState<string>('');
  const [reference, setReference] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const selectedAgreement = React.useMemo(
    () => agreements.find((agreement) => agreement.id === selectedAgreementId),
    [agreements, selectedAgreementId],
  );

  React.useEffect(() => {
    if (selectedAgreement) {
      setAmount(selectedAgreement.rentAmount.toString());
      setDueDate(selectedAgreement.startDate);
      setPaidAmount(selectedAgreement.rentAmount.toString());
    }
  }, [selectedAgreement]);

  const handleSubmit = React.useCallback(async () => {
    if (!selectedAgreement) {
      Alert.alert('Missing agreement', 'Select a rent agreement first.');
      return;
    }
    if (!dueDate) {
      Alert.alert('Missing due date', 'Choose a due date for this payment.');
      return;
    }
    if (!amount || Number.isNaN(Number(amount))) {
      Alert.alert('Invalid amount', 'Enter a valid amount.');
      return;
    }
    if ((status === 'paid' || status === 'partial') && (!paidAmount || Number.isNaN(Number(paidAmount)))) {
      Alert.alert('Invalid paid amount', 'Provide the paid amount to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        addPayment({
          agreementId: selectedAgreement.id,
          propertyId: selectedAgreement.propertyId,
          tenantId: selectedAgreement.tenantId,
          dueDate,
          amount: Number(amount),
          paidAmount:
            status === 'paid' || status === 'partial' ? Number(paidAmount || 0) : 0,
          lateFee: lateFee ? Number(lateFee) : undefined,
          paymentDate: paymentDate || undefined,
          status,
          method: method.trim() || undefined,
          transactionId: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          receipt: undefined,
        }),
      );
      Alert.alert('Payment recorded', 'Rent payment tracked successfully.', [
        {
          text: 'View Payments',
          onPress: () => router.replace('/(rent-tabs)/rent-payments'),
        },
      ]);
    } catch (error) {
      console.error('[RecordRentPayment] Failed to record payment', error);
      Alert.alert('Error', 'Unable to record payment right now.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addPayment,
    amount,
    dueDate,
    lateFee,
    notes,
    paidAmount,
    paymentDate,
    reference,
    router,
    selectedAgreement,
    status,
    method,
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
      testID="record-rent-payment-screen"
    >
      <Stack.Screen
        options={{
          title: 'Record Rent Payment',
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
          <Text style={styles.sectionLabel}>Agreement</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {agreements.map((agreement) => {
              const property = properties.find((item) => item.id === agreement.propertyId);
              const tenant = tenants.find((item) => item.id === agreement.tenantId);
              const isActive = agreement.id === selectedAgreementId;
              return (
                <TouchableOpacity
                  key={agreement.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSelectedAgreementId(agreement.id)}
                  activeOpacity={0.85}
                  testID={`payment-agreement-${agreement.id}`}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{property?.name ?? 'Property'}</Text>
                  <Text style={[styles.chipSubText, isActive && styles.chipTextActive]}>{tenant?.name ?? 'Tenant'}</Text>
                </TouchableOpacity>
              );
            })}
            {agreements.length === 0 && (
              <Text style={styles.emptyHelper}>Create a rent agreement before recording payments.</Text>
            )}
          </ScrollView>

          <Text style={styles.sectionLabel}>Due Date</Text>
          <DatePicker
            value={dueDate}
            onChange={setDueDate}
            label="Payment Due"
            testID="payment-due-date"
          />

          <Text style={styles.sectionLabel}>Amount Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Rent Amount"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            testID="payment-amount-input"
          />
          {(status === 'paid' || status === 'partial') && (
            <TextInput
              style={styles.input}
              placeholder="Paid Amount"
              placeholderTextColor={Colors.textSecondary}
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
              testID="payment-paid-amount-input"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Late Fee"
            placeholderTextColor={Colors.textSecondary}
            value={lateFee}
            onChangeText={setLateFee}
            keyboardType="numeric"
            testID="payment-late-fee-input"
          />

          {(status === 'paid' || status === 'partial') && (
            <DatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              label="Payment Date"
              testID="payment-date"
            />
          )}

          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusRow}>
            {PAYMENT_STATUSES.map((option) => {
              const isActive = option.value === status;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.statusChip, isActive && styles.statusChipActive]}
                  onPress={() => setStatus(option.value)}
                  activeOpacity={0.85}
                  testID={`payment-status-${option.value}`}
                >
                  <Text style={[styles.statusText, isActive && styles.statusTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Payment Method (UPI, Bank, Cash)"
            placeholderTextColor={Colors.textSecondary}
            value={method}
            onChangeText={setMethod}
            autoCapitalize="characters"
            testID="payment-method-input"
          />
          <TextInput
            style={styles.input}
            placeholder="Transaction Reference"
            placeholderTextColor={Colors.textSecondary}
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
            testID="payment-reference-input"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes"
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            testID="payment-notes-input"
          />

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || agreements.length === 0}
            testID="payment-submit-button"
            activeOpacity={0.9}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Save Payment'}</Text>
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
    minWidth: 160,
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
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusTextActive: {
    color: '#FFFFFF',
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