import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Save, DollarSign, CreditCard, ChevronDown, X } from 'lucide-react-native';
import NotificationBell from '@/components/NotificationBell';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { Payment } from '@/types/loan';
import DatePicker from '@/components/DatePicker';

export default function AddPaymentScreen() {
  const router = useRouter();
  const { loanId: paramLoanId, installmentId: paramInstallmentId } = useLocalSearchParams<{
    loanId?: string;
    installmentId?: string;
  }>();
  const { getLoanById, getInstallmentsByLoan, recordPayment, loans } = useLoans();
  const { currency } = useCurrency();

  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>(paramLoanId);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | undefined>(paramInstallmentId);
  const [showLoanPicker, setShowLoanPicker] = useState(false);
  const [showInstallmentPicker, setShowInstallmentPicker] = useState(false);

  const loan = selectedLoanId ? getLoanById(selectedLoanId) : null;
  const installments = selectedLoanId ? getInstallmentsByLoan(selectedLoanId) : [];
  const installment = selectedInstallmentId ? installments.find((i) => i.id === selectedInstallmentId) : null;
  
  const activeLoans = loans.filter(l => l.status === 'active');

  const remainingTotal = installment ? installment.totalAmount - installment.paidAmount : 0;
  const remainingPrincipal = installment 
    ? Math.max(0, installment.principalAmount - (installment.paidAmount * (installment.principalAmount / installment.totalAmount))) 
    : 0;
  const remainingInterest = installment
    ? Math.max(0, installment.interestAmount - (installment.paidAmount * (installment.interestAmount / installment.totalAmount)))
    : 0;

  const [principalAmount, setPrincipalAmount] = useState(
    remainingPrincipal.toFixed(2)
  );
  const [interestAmount, setInterestAmount] = useState(
    remainingInterest.toFixed(2)
  );
  const [totalAmount, setTotalAmount] = useState(
    remainingTotal.toFixed(2)
  );
  const today = new Date();
  const [paymentDate, setPaymentDate] = useState(
    `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
  );
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const principal = parseFloat(principalAmount) || 0;
    const interest = parseFloat(interestAmount) || 0;
    setTotalAmount((principal + interest).toFixed(2));
  }, [principalAmount, interestAmount]);

  const availableInstallments = installments.filter(inst => inst.status !== 'paid');

  const handleSave = async () => {
    if (!selectedLoanId || !selectedInstallmentId) {
      Alert.alert('Error', 'Please select a loan and installment');
      return;
    }

    if (!loan || !installment) {
      Alert.alert('Error', 'Selected loan or installment not found');
      return;
    }

    const paymentTotalAmount = parseFloat(totalAmount);
    const paymentPrincipalAmount = parseFloat(principalAmount);
    const paymentInterestAmount = parseFloat(interestAmount);

    if (!totalAmount || paymentTotalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    const tolerance = 0.01;
    if (paymentTotalAmount > remainingTotal + tolerance) {
      Alert.alert(
        'Error',
        `Payment amount cannot exceed remaining amount of ${formatCurrency(remainingTotal, currency.code, currency.symbol)}`
      );
      return;
    }

    try {
      const payment: Payment = {
        id: Date.now().toString(),
        loanId: selectedLoanId,
        installmentId: selectedInstallmentId,
        amount: paymentTotalAmount,
        principalAmount: paymentPrincipalAmount,
        interestAmount: paymentInterestAmount,
        paymentDate: new Date(paymentDate.split('-').reverse().join('-')).toISOString(),
        method: paymentMethod,
        notes: notes.trim(),
      };

      console.log('[iOS/Web] Recording payment:', payment.id);
      recordPayment(selectedInstallmentId, payment);

      const isFullyPaid = paymentTotalAmount >= remainingTotal;
      const message = isFullyPaid
        ? `Hi ${loan.borrowerName}, we confirm receipt of your payment of ${formatCurrency(paymentTotalAmount, currency.code, currency.symbol)} for installment #${installment.installmentNumber}. This installment is now fully paid. Thank you!`
        : `Hi ${loan.borrowerName}, we confirm receipt of your payment of ${formatCurrency(paymentTotalAmount, currency.code, currency.symbol)} for installment #${installment.installmentNumber}. Remaining balance: ${formatCurrency(remainingTotal - paymentTotalAmount, currency.code, currency.symbol)}. Thank you!`;

      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[iOS/Web] Payment recorded, navigating back');
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/loans');
      }

      requestAnimationFrame(() => {
        Alert.alert(
          'Success',
          'Payment recorded successfully',
          [
            {
              text: 'Send WhatsApp Receipt',
              onPress: () => {
                const phoneNumber = loan.borrowerPhone.replace(/[^0-9]/g, '');
                const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                Linking.openURL(url);
              },
            },
            {
              text: 'Done',
            },
          ]
        );
      });
    } catch (error) {
      console.error('[iOS/Web] Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const PaymentMethodButton = ({ method }: { method: string }) => (
    <TouchableOpacity
      style={[
        styles.methodButton,
        paymentMethod === method && styles.methodButtonActive,
      ]}
      onPress={() => setPaymentMethod(method)}
    >
      <Text
        style={[
          styles.methodButtonText,
          paymentMethod === method && styles.methodButtonTextActive,
        ]}
      >
        {method}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Record Payment',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <NotificationBell />
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Save color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!paramLoanId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Loan & Installment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loan *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowLoanPicker(true)}
              >
                <Text style={[styles.pickerText, !loan && styles.pickerPlaceholder]}>
                  {loan ? loan.borrowerName : 'Select a loan'}
                </Text>
                <ChevronDown color={Colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {selectedLoanId && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Installment *</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowInstallmentPicker(true)}
                >
                  <Text style={[styles.pickerText, !installment && styles.pickerPlaceholder]}>
                    {installment ? `Installment #${installment.installmentNumber} - Due ${formatDate(installment.dueDate)}` : 'Select an installment'}
                  </Text>
                  <ChevronDown color={Colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {loan && installment && (
          <View style={styles.loanCard}>
            <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
            <Text style={styles.installmentTitle}>
              Installment #{installment.installmentNumber}
            </Text>
            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(installment.totalAmount, currency.code, currency.symbol)}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Already Paid</Text>
                <Text style={[styles.amountValue, { color: Colors.success }]}>
                  {formatCurrency(installment.paidAmount, currency.code, currency.symbol)}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Remaining</Text>
                <Text style={[styles.amountValue, { color: Colors.error }]}>
                  {formatCurrency(remainingTotal, currency.code, currency.symbol)}
                </Text>
              </View>
            </View>
            <Text style={styles.dueDate}>Due: {formatDate(installment.dueDate)}</Text>
          </View>
        )}

        {loan && installment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount *</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.inputWithIconText}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                value={principalAmount}
                onChangeText={setPrincipalAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.hint}>
              Remaining Principal: {formatCurrency(remainingPrincipal, currency.code, currency.symbol)}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Amount *</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.inputWithIconText}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                value={interestAmount}
                onChangeText={setInterestAmount}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.hint}>
              Remaining Interest: {formatCurrency(remainingInterest, currency.code, currency.symbol)}
            </Text>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Payment Amount</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(parseFloat(totalAmount), currency.code, currency.symbol)}
            </Text>
          </View>

          <View style={styles.quickAmountButtons}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => {
                const half = remainingTotal / 2;
                const halfPrincipal = remainingPrincipal / 2;
                const halfInterest = remainingInterest / 2;
                setPrincipalAmount(halfPrincipal.toFixed(2));
                setInterestAmount(halfInterest.toFixed(2));
              }}
            >
              <Text style={styles.quickButtonText}>Half</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => {
                setPrincipalAmount(remainingPrincipal.toFixed(2));
                setInterestAmount(remainingInterest.toFixed(2));
              }}
            >
              <Text style={styles.quickButtonText}>Full Amount</Text>
            </TouchableOpacity>
            </View>
          </View>
        )}

        {loan && installment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <DatePicker
            label="Payment Date *"
            value={paymentDate}
            onChange={setPaymentDate}
            testID="payment-date-picker"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method *</Text>
            <View style={styles.methodGrid}>
              <PaymentMethodButton method="Cash" />
              <PaymentMethodButton method="Bank Transfer" />
              <PaymentMethodButton method="Check" />
              <PaymentMethodButton method="Mobile Money" />
              <PaymentMethodButton method="Other" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes about this payment..."
              placeholderTextColor={Colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
        )}

        {loan && installment && (
        <View style={styles.infoCard}>
          <CreditCard color={Colors.info} size={24} />
          <Text style={styles.infoText}>
            After recording this payment, you'll have the option to send a WhatsApp
            receipt to {loan.borrowerName}.
          </Text>
        </View>
        )}

        {loan && installment && (
          <TouchableOpacity style={styles.recordButton} onPress={handleSave}>
            <Text style={styles.recordButtonText}>Record Payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={showLoanPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoanPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Loan</Text>
              <TouchableOpacity onPress={() => setShowLoanPicker(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={activeLoans}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedLoanId(item.id);
                    setSelectedInstallmentId(undefined);
                    setPrincipalAmount('0.00');
                    setInterestAmount('0.00');
                    setShowLoanPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.borrowerName}</Text>
                  <Text style={styles.modalItemSubtext}>
                    {formatCurrency(item.principalAmount, currency.code, currency.symbol)} - {item.status}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModalState}>
                  <Text style={styles.emptyModalText}>No active loans available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInstallmentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInstallmentPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Installment</Text>
              <TouchableOpacity onPress={() => setShowInstallmentPicker(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableInstallments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const remaining = item.totalAmount - item.paidAmount;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedInstallmentId(item.id);
                      const remainingPrin = Math.max(0, item.principalAmount - (item.paidAmount * (item.principalAmount / item.totalAmount)));
                      const remainingInt = Math.max(0, item.interestAmount - (item.paidAmount * (item.interestAmount / item.totalAmount)));
                      setPrincipalAmount(remainingPrin.toFixed(2));
                      setInterestAmount(remainingInt.toFixed(2));
                      setShowInstallmentPicker(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      Installment #{item.installmentNumber}
                    </Text>
                    <Text style={styles.modalItemSubtext}>
                      Due: {formatDate(item.dueDate)} - Remaining: {formatCurrency(remaining, currency.code, currency.symbol)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyModalState}>
                  <Text style={styles.emptyModalText}>No unpaid installments available</Text>
                </View>
              }
            />
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
  saveButton: {
    marginRight: 16,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loanCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  borrowerName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  installmentTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  amountSection: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dueDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIconText: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.info + '15',
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.info,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  recordButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyModalState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
