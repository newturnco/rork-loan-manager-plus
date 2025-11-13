import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Plus, Filter } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { Loan, LoanStatus } from '@/types/loan';
import { useResponsive } from '@/utils/responsive';

export default function LoansScreen() {
  const router = useRouter();
  const { loans, getInstallmentsByLoan } = useLoans();
  const { currency } = useCurrency();
  const { isTablet, contentMaxWidth, horizontalPadding } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LoanStatus | 'all'>('all');

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = loan.borrowerName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || loan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case 'active':
        return Colors.info;
      case 'completed':
        return Colors.success;
      case 'overdue':
        return Colors.error;
      case 'defaulted':
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: LoanStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const calculateProgress = (loan: Loan) => {
    const installments = getInstallmentsByLoan(loan.id);
    if (installments.length === 0) return 0;
    const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalAmount = installments.reduce((sum, i) => sum + i.totalAmount, 0);
    return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  };

  const LoanCard = ({ loan }: { loan: Loan }) => {
    const progress = calculateProgress(loan);
    const installments = getInstallmentsByLoan(loan.id);
    const totalAmount = installments.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);

    return (
      <TouchableOpacity
        style={styles.loanCard}
        onPress={() =>
          router.push({
            pathname: '/loan-details',
            params: { loanId: loan.id },
          })
        }
      >
        <View style={styles.loanHeader}>
          <View style={styles.loanInfo}>
            <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(loan.status) + '20' },
              ]}
            >
              <Text
                style={[styles.statusText, { color: getStatusColor(loan.status) }]}
              >
                {getStatusLabel(loan.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Principal</Text>
            <Text style={styles.amount}>{formatCurrency(loan.principalAmount, currency.code, currency.symbol)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Total Due</Text>
            <Text style={styles.amount}>{formatCurrency(totalAmount, currency.code, currency.symbol)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.label}>Remaining</Text>
            <Text style={[styles.amount, { color: Colors.error }]}>
              {formatCurrency(totalAmount - totalPaid, currency.code, currency.symbol)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getStatusColor(loan.status),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}% paid</Text>
        </View>

        <View style={styles.loanMeta}>
          <Text style={styles.metaText}>
            {loan.interestRate}% {loan.interestType} interest
          </Text>
          <Text style={styles.metaText}>
            {installments.length} installments
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Start: {formatDate(loan.startDate)}</Text>
          <Text style={styles.dateLabel}>End: {formatDate(loan.endDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'All Loans',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-loan')}
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
            placeholder="Search borrowers..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'active', 'completed', 'overdue', 'defaulted'] as const).map(
          (status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth },
        ]}
      >
        {filteredLoans.length === 0 ? (
          <View style={styles.emptyState}>
            <Filter color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>
              {searchQuery || filterStatus !== 'all'
                ? 'No Matching Loans'
                : 'No Loans Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Create your first loan to get started'}
            </Text>
          </View>
        ) : (
          filteredLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 32,
    justifyContent: 'center' as const,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  loanCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loanHeader: {
    marginBottom: 16,
  },
  loanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borrowerName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  loanDetails: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  loanMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
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
