import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Plus, DollarSign, Calendar, Trash2 } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { Payment } from '@/types/loan';

export default function PaymentsScreen() {
  const router = useRouter();
  const { payments, loans, installments, deletePayment } = useLoans();
  const { currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPayments = payments.filter((payment) => {
    const loan = loans.find((l) => l.id === payment.loanId);
    const matchesSearch = loan?.borrowerName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedPayments = [...filteredPayments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  const handleDeletePayment = (payment: Payment) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePayment(payment.id),
        },
      ]
    );
  };

  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const loan = loans.find((l) => l.id === payment.loanId);
    const installment = installments.find((i) => i.id === payment.installmentId);

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.success + '15' }]}>
              <DollarSign color={Colors.success} size={20} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.borrowerName}>{loan?.borrowerName || 'Unknown'}</Text>
              <Text style={styles.installmentText}>
                Installment #{installment?.installmentNumber || 'N/A'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePayment(payment)}
          >
            <Trash2 color={Colors.error} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Payment Amount</Text>
          <Text style={styles.amount}>{formatCurrency(payment.amount, currency.code, currency.symbol)}</Text>
        </View>

        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Principal</Text>
            <Text style={styles.breakdownValue}>
              {formatCurrency(payment.principalAmount, currency.code, currency.symbol)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Interest</Text>
            <Text style={[styles.breakdownValue, { color: Colors.success }]}>
              {formatCurrency(payment.interestAmount, currency.code, currency.symbol)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <Calendar color={Colors.textSecondary} size={14} />
            <Text style={styles.dateText}>{formatDate(payment.paymentDate)}</Text>
          </View>
          {payment.notes && (
            <Text style={styles.notes} numberOfLines={1}>
              {payment.notes}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Payment History',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      router.push('/add-payment');
                    }, 0);
                  });
                } else {
                  router.push('/add-payment');
                }
              }}
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
            placeholder="Search payments..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Payments</Text>
          <Text style={styles.summaryValue}>{payments.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
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
        {sortedPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Payments' : 'No Payments Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Payment history will appear here'}
            </Text>
          </View>
        ) : (
          sortedPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  summaryValue: {
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
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  installmentText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  amountContainer: {
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  breakdown: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
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
