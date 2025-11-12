import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  DollarSign,
} from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { formatCurrency, formatDate, getDaysUntil } from '@/utils/calculations';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { dashboardStats, loans, isLoading } = useLoans();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const StatCard = ({
    label,
    value,
    color,
    icon,
  }: {
    label: string;
    value: string;
    color: string;
    icon: React.ReactNode;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.statHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'LendTrack Pro',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-loan')}
              style={styles.addButton}
            >
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            {loans.length === 0
              ? 'Start by creating your first loan'
              : `Managing ${loans.length} ${loans.length === 1 ? 'loan' : 'loans'}`}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Lent"
            value={formatCurrency(dashboardStats.totalAmountLent)}
            color={Colors.primary}
            icon={<TrendingUp color={Colors.primary} size={20} />}
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(dashboardStats.totalOutstanding)}
            color={Colors.warning}
            icon={<Clock color={Colors.warning} size={20} />}
          />
          <StatCard
            label="Received"
            value={formatCurrency(dashboardStats.totalAmountReceived)}
            color={Colors.success}
            icon={<CheckCircle color={Colors.success} size={20} />}
          />
          <StatCard
            label="Interest Earned"
            value={formatCurrency(dashboardStats.totalInterestEarned)}
            color={Colors.secondary}
            icon={<DollarSign color={Colors.secondary} size={20} />}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan Overview</Text>
          </View>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{dashboardStats.activeLoansCount}</Text>
              <Text style={styles.overviewLabel}>Active</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: Colors.success }]}>
                {dashboardStats.completedLoansCount}
              </Text>
              <Text style={styles.overviewLabel}>Completed</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: Colors.error }]}>
                {dashboardStats.overdueLoansCount}
              </Text>
              <Text style={styles.overviewLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {dashboardStats.overduePayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle color={Colors.error} size={20} />
              <Text style={[styles.sectionTitle, { color: Colors.error, marginLeft: 8 }]}>
                Overdue Payments
              </Text>
            </View>
            {dashboardStats.overduePayments.slice(0, 3).map((installment) => {
              const loan = loans.find((l) => l.id === installment.loanId);
              const daysOverdue = Math.abs(getDaysUntil(installment.dueDate));
              return (
                <TouchableOpacity
                  key={installment.id}
                  style={[styles.paymentCard, styles.overdueCard]}
                  onPress={() =>
                    router.push({
                      pathname: '/loan-details',
                      params: { loanId: installment.loanId },
                    })
                  }
                >
                  <View style={styles.paymentInfo}>
                    <Text style={styles.borrowerName}>{loan?.borrowerName}</Text>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(installment.totalAmount - installment.paidAmount)}
                    </Text>
                  </View>
                  <Text style={styles.overdueText}>{daysOverdue} days overdue</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {dashboardStats.upcomingPayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock color={Colors.info} size={20} />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                Upcoming Payments
              </Text>
            </View>
            {dashboardStats.upcomingPayments.map((installment) => {
              const loan = loans.find((l) => l.id === installment.loanId);
              const daysUntil = getDaysUntil(installment.dueDate);
              return (
                <TouchableOpacity
                  key={installment.id}
                  style={styles.paymentCard}
                  onPress={() =>
                    router.push({
                      pathname: '/loan-details',
                      params: { loanId: installment.loanId },
                    })
                  }
                >
                  <View style={styles.paymentInfo}>
                    <Text style={styles.borrowerName}>{loan?.borrowerName}</Text>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(installment.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.paymentMeta}>
                    <Text style={styles.dueDate}>{formatDate(installment.dueDate)}</Text>
                    <Text style={styles.daysUntil}>
                      {daysUntil === 0
                        ? 'Due today'
                        : daysUntil === 1
                        ? 'Due tomorrow'
                        : `In ${daysUntil} days`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {loans.length === 0 && (
          <View style={styles.emptyState}>
            <TrendingDown color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>No Loans Yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your loans by creating your first loan entry
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-loan')}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.emptyButtonText}>Create First Loan</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    marginRight: 16,
    padding: 8,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    margin: '1%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  overviewGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  daysUntil: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.info,
  },
  overdueText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
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
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
