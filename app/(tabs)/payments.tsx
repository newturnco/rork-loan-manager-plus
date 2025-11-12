import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Plus, Trash2, DollarSign } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';

export default function PaymentsScreen() {
  const router = useRouter();
  const { payments, installments, deletePayment, getLoanById } = useLoans();
  const { getCustomerById } = useCustomers();
  const { currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  const allPayments = [...payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  const filteredPayments = allPayments.filter((payment) => {
    const loan = getLoanById(payment.loanId);
    if (!loan) return false;
    const customer = getCustomerById(loan.customerId || '');
    const matchesSearch =
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDeletePayment = (paymentId: string, borrowerName: string) => {
    Alert.alert(
      'Delete Payment',
      `Are you sure you want to delete this payment for ${borrowerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePayment(paymentId),
        },
      ]
    );
  };

  const PaymentCard = ({ payment }: { payment: any }) => {
    const loan = getLoanById(payment.loanId);
    const installment = installments.find((i) => i.id === payment.installmentId);
    
    if (!loan) return null;

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <View style={styles.iconContainer}>
              <DollarSign color={Colors.success} size={20} />
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
              <Text style={styles.paymentDate}>{formatDate(payment.paymentDate)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeletePayment(payment.id, loan.borrowerName)}
            style={styles.deleteButton}
          >
            <Trash2 color={Colors.error} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Total Payment</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(payment.amount, currency.code, currency.symbol)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Principal</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(payment.principalAmount, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Interest</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(payment.interestAmount, currency.code, currency.symbol)}
              </Text>
            </View>
          </View>
        </View>

        {installment && (
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>
              Installment #{installment.installmentNumber}
            </Text>
            <Text style={styles.metaText}>
              Due: {formatDate(installment.dueDate)}
            </Text>
          </View>
        )}

        {payment.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Payment Entries',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-payment')}
              style={styles.headerButton}
            >
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={Colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by borrower..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Payments</Text>
          <Text style={styles.statValue}>{payments.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Collected</Text>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {formatCurrency(
              payments.reduce((sum, p) => sum + p.amount, 0),
              currency.code,
              currency.symbol
            )}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Payments' : 'No Payments Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Record your first payment to get started'}
            </Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  amountSection: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  breakdownLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
