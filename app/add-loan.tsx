import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Save, Calendar, DollarSign, User, Plus, ChevronDown } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import Colors from '@/constants/colors';
import { Loan, InterestType, InstallmentFrequency } from '@/types/loan';
import { calculateInterestRate, calculateInterestAmount, calculateDurationInMonths, formatDateToISO, parseDateDDMMYYYY } from '@/utils/calculations';

export default function AddLoanScreen() {
  const router = useRouter();
  const { addLoan } = useLoans();
  const { customers } = useCustomers();
  const { currency } = useCurrency();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestInputMode, setInterestInputMode] = useState<'rate' | 'amount'>('rate');
  const [interestRate, setInterestRate] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const today = new Date();
  const [startDate, setStartDate] = useState(
    `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
  );
  const [numberOfInstallments, setNumberOfInstallments] = useState('');
  const [installmentFrequency, setInstallmentFrequency] =
    useState<InstallmentFrequency>('monthly');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        setBorrowerName(customer.name);
        setBorrowerPhone(customer.phone);
      }
    }
  }, [selectedCustomer, customers]);

  useEffect(() => {
    if (principalAmount && numberOfInstallments && startDate) {
      const endDateStr = calculateEndDate();
      if (endDateStr !== 'N/A' && endDateStr !== 'Invalid Date') {
        const startISO = formatDateToISO(startDate);
        const endISO = formatDateToISO(endDateStr);
        const duration = calculateDurationInMonths(startISO, endISO);
        
        if (interestInputMode === 'rate' && interestRate) {
          const amount = calculateInterestAmount(
            parseFloat(principalAmount),
            parseFloat(interestRate),
            interestType,
            duration
          );
          setInterestAmount(amount.toFixed(2));
        } else if (interestInputMode === 'amount' && interestAmount) {
          const rate = calculateInterestRate(
            parseFloat(principalAmount),
            parseFloat(interestAmount),
            interestType,
            duration
          );
          setInterestRate(rate.toFixed(2));
        }
      }
    }
  }, [principalAmount, interestRate, interestAmount, interestType, numberOfInstallments, startDate, installmentFrequency, interestInputMode]);

  const calculateEndDate = () => {
    if (!startDate || !numberOfInstallments) {
      return 'N/A';
    }

    try {
      const start = parseDateDDMMYYYY(startDate);
      if (!start || isNaN(start.getTime())) {
        return 'Invalid Date';
      }

      const installments = parseInt(numberOfInstallments) || 1;

      const daysToAdd = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 90,
        yearly: 365,
      }[installmentFrequency];

      const end = new Date(start);
      end.setDate(end.getDate() + daysToAdd * installments);
      
      if (isNaN(end.getTime())) {
        return 'Invalid Date';
      }

      const day = String(end.getDate()).padStart(2, '0');
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const year = end.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error calculating end date:', error);
      return 'Invalid Date';
    }
  };

  const handleSave = () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!principalAmount || parseFloat(principalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }
    if (interestInputMode === 'rate' && (!interestRate || parseFloat(interestRate) < 0)) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }
    if (interestInputMode === 'amount' && (!interestAmount || parseFloat(interestAmount) < 0)) {
      Alert.alert('Error', 'Please enter a valid interest amount');
      return;
    }
    if (!numberOfInstallments || parseInt(numberOfInstallments) <= 0) {
      Alert.alert('Error', 'Please enter valid number of installments');
      return;
    }

    const endDateStr = calculateEndDate();
    if (endDateStr === 'N/A' || endDateStr === 'Invalid Date') {
      Alert.alert('Error', 'Please enter a valid start date and number of installments');
      return;
    }

    const loan: Loan = {
      id: Date.now().toString(),
      customerId: selectedCustomer,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate),
      interestAmount: interestAmount ? parseFloat(interestAmount) : undefined,
      interestType,
      startDate: formatDateToISO(startDate),
      endDate: formatDateToISO(endDateStr),
      installmentFrequency,
      numberOfInstallments: parseInt(numberOfInstallments),
      status: 'active',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      currency: currency.code,
    };

    addLoan(loan);
    Alert.alert('Success', 'Loan created successfully', [
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

  const FrequencyButton = ({
    freq,
    label,
  }: {
    freq: InstallmentFrequency;
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.freqButton,
        installmentFrequency === freq && styles.freqButtonActive,
      ]}
      onPress={() => setInstallmentFrequency(freq)}
    >
      <Text
        style={[
          styles.freqButtonText,
          installmentFrequency === freq && styles.freqButtonTextActive,
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
          title: 'New Loan',
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Selection</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Customer *</Text>
            <TouchableOpacity 
              style={styles.customerSelector}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={selectedCustomer ? styles.customerSelectedText : styles.customerPlaceholderText}>
                {selectedCustomer ? borrowerName : 'Select a customer'}
              </Text>
              <Save color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
            
            {customers.length === 0 && (
              <TouchableOpacity
                style={styles.addCustomerButton}
                onPress={() => router.push('/add-customer')}
              >
                <Save color={Colors.primary} size={18} />
                <Text style={styles.addCustomerText}>Add New Customer</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedCustomer && (
            <View style={styles.customerInfo}>
              <Text style={styles.customerInfoLabel}>Selected Customer</Text>
              <Text style={styles.customerInfoName}>{borrowerName}</Text>
              <Text style={styles.customerInfoPhone}>{borrowerPhone}</Text>
            </View>
          )}
        </View>

        <Modal
          visible={showCustomerModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCustomerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Customer</Text>
                <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerItem}
                    onPress={() => {
                      setSelectedCustomer(customer.id);
                      setShowCustomerModal(false);
                    }}
                  >
                    <Text style={styles.customerItemName}>{customer.name}</Text>
                    <Text style={styles.customerItemPhone}>{customer.phone}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addNewCustomerItem}
                  onPress={() => {
                    setShowCustomerModal(false);
                    router.push('/add-customer');
                  }}
                >
                  <Save color={Colors.primary} size={20} />
                  <Text style={styles.addNewCustomerText}>Add New Customer</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>

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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Input Mode *</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  interestInputMode === 'rate' && styles.optionButtonActive,
                ]}
                onPress={() => setInterestInputMode('rate')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    interestInputMode === 'rate' && styles.optionButtonTextActive,
                  ]}
                >
                  By Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  interestInputMode === 'amount' && styles.optionButtonActive,
                ]}
                onPress={() => setInterestInputMode('amount')}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    interestInputMode === 'amount' && styles.optionButtonTextActive,
                  ]}
                >
                  By Amount
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {interestInputMode === 'rate' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interest Rate (%) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor={Colors.textSecondary}
                value={interestRate}
                onChangeText={(text) => {
                  setInterestRate(text);
                }}
                keyboardType="decimal-pad"
              />
              {interestAmount && (
                <Text style={styles.calculatedHint}>
                  Calculated Interest Amount: ${parseFloat(interestAmount).toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interest Amount ($) *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign color={Colors.textSecondary} size={20} />
                <TextInput
                  style={styles.inputWithIconText}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  value={interestAmount}
                  onChangeText={(text) => {
                    setInterestAmount(text);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              {interestRate && (
                <Text style={styles.calculatedHint}>
                  Calculated Interest Rate: {parseFloat(interestRate).toFixed(2)}%
                </Text>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Type *</Text>
            <View style={styles.optionRow}>
              <InterestTypeButton type="simple" label="Simple Interest" />
              <InterestTypeButton type="compound" label="Compound Interest" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date *</Text>
            <View style={styles.inputWithIcon}>
              <Calendar color={Colors.textSecondary} size={20} />
              <TextInput
                style={styles.inputWithIconText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <Text style={styles.hint}>Format: DD-MM-YYYY</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Installments *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of installments"
              placeholderTextColor={Colors.textSecondary}
              value={numberOfInstallments}
              onChangeText={setNumberOfInstallments}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Installment Frequency *</Text>
            <View style={styles.freqGrid}>
              <FrequencyButton freq="weekly" label="Weekly" />
              <FrequencyButton freq="biweekly" label="Bi-weekly" />
              <FrequencyButton freq="monthly" label="Monthly" />
              <FrequencyButton freq="quarterly" label="Quarterly" />
              <FrequencyButton freq="yearly" label="Yearly" />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Estimated End Date</Text>
            <Text style={styles.infoValue}>{calculateEndDate()}</Text>
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

        <TouchableOpacity style={styles.createButton} onPress={handleSave}>
          <Text style={styles.createButtonText}>Create Loan</Text>
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
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
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
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  freqButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  freqButtonTextActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerSelectedText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  customerPlaceholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },
  addCustomerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  customerInfo: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  customerInfoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  customerInfoName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerInfoPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    maxHeight: '80%',
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
  customerItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerItemPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addNewCustomerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addNewCustomerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  calculatedHint: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 8,
    fontWeight: '600' as const,
  },
});
