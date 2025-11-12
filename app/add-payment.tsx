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
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Save, DollarSign, CreditCard } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { Payment } from '@/types/loan';
import DatePicker from '@/components/DatePicker';

export default function AddPaymentScreen() {
  const router = useRouter();
  const { loanId, installmentId } = useLocalSearchParams<{
    loanId: string;
    installmentId: string;
  }>();
  const { getLoanById, getInstallmentsByLoan, recordPayment } = useLoans();
  const { currency } = useCurrency();

  const loan = getLoanById(loanId);
  const installments = getInstallmentsByLoan(loanId);
  const installment = installments.find((i) => i.id === installmentId);

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

  if (!loan || !installment) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Not Found' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loan or installment not found</Text>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    const paymentTotalAmount = parseFloat(totalAmount);
    const paymentPrincipalAmount = parseFloat(principalAmount);
    const paymentInterestAmount = parseFloat(interestAmount);

    if (!totalAmount || paymentTotalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentTotalAmount > remainingTotal) {
      Alert.alert(
        'Error',
        `Payment amount cannot exceed remaining amount of ${formatCurrency(remainingTotal, currency.code, currency.symbol)}`
      );
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      loanId,
      installmentId,
      amount: paymentTotalAmount,
      principalAmount: paymentPrincipalAmount,
      interestAmount: paymentInterestAmount,
      paymentDate: new Date(paymentDate.split('-').reverse().join('-')).toISOString(),
      method: paymentMethod,
      notes: notes.trim(),
    };

    recordPayment(installmentId, payment);

    const isFullyPaid = paymentTotalAmount >= remainingTotal;
    const message = isFullyPaid
      ? `Hi ${loan.borrowerName}, we confirm receipt of your payment of ${formatCurrency(paymentTotalAmount, currency.code, currency.symbol)} for installment #${installment.installmentNumber}. This installment is now fully paid. Thank you!`
      : `Hi ${loan.borrowerName}, we confirm receipt of your payment of ${formatCurrency(paymentTotalAmount, currency.code, currency.symbol)} for installment #${installment.installmentNumber}. Remaining balance: ${formatCurrency(remainingTotal - paymentTotalAmount, currency.code, currency.symbol)}. Thank you!`;

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
            router.back();
          },
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
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
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Save color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount *</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign color={Colors.textSecondary} size={20} />
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
              <DollarSign color={Colors.textSecondary} size={20} />
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

        <View style={styles.infoCard}>
          <CreditCard color={Colors.info} size={24} />
          <Text style={styles.infoText}>
            After recording this payment, you'll have the option to send a WhatsApp
            receipt to {loan.borrowerName}.
          </Text>
        </View>

        <TouchableOpacity style={styles.recordButton} onPress={handleSave}>
          <Text style={styles.recordButtonText}>Record Payment</Text>
        </TouchableOpacity>
      </ScrollView>
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
});
