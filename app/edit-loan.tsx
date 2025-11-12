import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import Colors from '@/constants/colors';
import { InterestType, InstallmentFrequency } from '@/types/loan';
import DatePicker from '@/components/DatePicker';
import { formatDate } from '@/utils/calculations';

export default function EditLoanScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { getLoanById, updateLoan } = useLoans();
  const { currency } = useCurrency();

  const loan = getLoanById(loanId);

  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (loan) {
      setPrincipalAmount(loan.principalAmount.toString());
      setInterestRate(loan.interestRate.toString());
      setInterestType(loan.interestType);
      setNotes(loan.notes || '');
    }
  }, [loan]);

  if (!loan) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Loan Not Found' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loan not found</Text>
        </View>
      </View>
    );
  }

  const handleSave = () => {
    if (!principalAmount || parseFloat(principalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }
    if (!interestRate || parseFloat(interestRate) < 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    updateLoan(loanId, {
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate),
      interestType,
      notes: notes.trim(),
    });

    Alert.alert('Success', 'Loan updated successfully', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const InterestTypeButton = ({
    type,
    label,
  }: {
    type: InterestType;
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        interestType === type && styles.optionButtonActive,
      ]}
      onPress={() => setInterestType(type)}
    >
      <Text
        style={[
          styles.optionButtonText,
          interestType === type && styles.optionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Loan',
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
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Note: Editing the loan will not affect existing installments and payments. Only the loan record will be updated.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Borrower Information</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Borrower Name</Text>
            <Text style={styles.readOnlyValue}>{loan.borrowerName}</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Phone Number</Text>
            <Text style={styles.readOnlyValue}>{loan.borrowerPhone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>

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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (%) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor={Colors.textSecondary}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Type *</Text>
            <View style={styles.optionRow}>
              <InterestTypeButton type="simple" label="Simple Interest" />
              <InterestTypeButton type="compound" label="Compound Interest" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule (Read Only)</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Start Date</Text>
            <Text style={styles.readOnlyValue}>{formatDate(loan.startDate)}</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>End Date</Text>
            <Text style={styles.readOnlyValue}>{formatDate(loan.endDate)}</Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Frequency</Text>
            <Text style={styles.readOnlyValue}>
              {loan.installmentFrequency.charAt(0).toUpperCase() +
                loan.installmentFrequency.slice(1)}
            </Text>
          </View>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyLabel}>Number of Installments</Text>
            <Text style={styles.readOnlyValue}>{loan.numberOfInstallments}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter any additional notes (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.saveFullButton} onPress={handleSave}>
          <Text style={styles.saveFullButtonText}>Save Changes</Text>
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
    marginBottom: 16,
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
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  optionButtonTextActive: {
    color: Colors.primary,
  },
  textArea: {
    minHeight: 100,
  },
  saveFullButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveFullButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  readOnlyField: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
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
  infoCard: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
