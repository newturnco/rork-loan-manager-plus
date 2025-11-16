import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationBell from '../../components/NotificationBell';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  DollarSign,
  ArrowRight,
} from 'lucide-react-native';
import { useLoans } from '../../contexts/LoanContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency, formatDate, getDaysUntil } from '../../utils/calculations';
import Colors from '../../constants/colors';
import { useResponsive } from '../../utils/responsive';
import { useModule } from '../../contexts/ModuleContext';

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]} testID={`stat-card-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      <View style={styles.statHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>{icon}</View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function LoanDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dashboardStats, loans } = useLoans();
  const { currency } = useCurrency();
  const { isTablet, contentMaxWidth, horizontalPadding } = useResponsive();
  const { selectModule } = useModule();
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const onRefresh = React.useCallback(() => {
    console.log('Refreshing loan dashboard');
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSwitchModule = React.useCallback(() => {
    Alert.alert(
      'Switch Module',
      'Do you want to switch to Rent Management?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await selectModule('rent');
              router.replace('/(rent-tabs)/rent-dashboard');
            } catch (error) {
              console.error('[LoanDashboard] Failed to switch module', error);
              Alert.alert('Switch Failed', 'Unable to switch modules. Please try again.');
            }
          },
        },
      ],
    );
  }, [router, selectModule]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'LendTrack Pro',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleSwitchModule}
              style={styles.switchButton}
              testID="loan-dashboard-switch-module"
            >
              <ArrowRight color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  console.log('Navigating to add loan');
                  router.push('/add-loan');
                }}
                style={styles.addButton}
                testID="dashboard-add-loan-button"
              >
                <Plus color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <NotificationBell />
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, paddingTop: insets.top },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        testID="loan-dashboard-scroll"
      >
        <View
          style={[
            styles.header,
            isTablet && { alignSelf: 'center', maxWidth: contentMaxWidth, width: '100%' },
          ]}
        >
          <Text style={styles.greeting}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            {loans.length === 0
              ? 'Start by creating your first loan'
              : `Managing ${loans.length} ${loans.length === 1 ? 'loan' : 'loans'}`}
          </Text>
        </View>

        <View
          style={[
            styles.statsGrid,
            isTablet && { alignSelf: 'center', maxWidth: contentMaxWidth, width: '100%' },
          ]}
        >
          <StatCard
            label="Total Lent"
            value={formatCurrency(dashboardStats.totalAmountLent, currency.code, currency.symbol)}
            color={Colors.primary}
            icon={<TrendingUp color={Colors.primary} size={20} />}
          />
          <StatCard
            label="Total Received"
            value={formatCurrency(dashboardStats.totalAmountReceived, currency.code, currency.symbol)}
            color={Colors.success}
            icon={<CheckCircle color={Colors.success} size={20} />}
          />
          <StatCard
            label="Total Outstanding"
            value={formatCurrency(dashboardStats.totalOutstanding, currency.code, currency.symbol)}
            color={Colors.warning}
            icon={<Clock color={Colors.warning} size={20} />}
          />
          <StatCard
            label="Interest Expected"
            value={formatCurrency(dashboardStats.totalInterestExpected, currency.code, currency.symbol)}
            color={Colors.info}
            icon={<TrendingDown color={Colors.info} size={20} />}
          />
          <StatCard
            label="Interest Earned"
            value={formatCurrency(dashboardStats.totalInterestEarned, currency.code, currency.symbol)}
            color={Colors.success}
            icon={<DollarSign color={Colors.success} size={20} />}
          />
        </View>

        <View style={styles.principalTrackingSection}>
          <Text style={styles.sectionTitle}>Principal Tracking</Text>
          <View style={styles.principalGrid}>
            <View style={styles.principalCard}>
              <Text style={styles.principalLabel}>Principal Received</Text>
              <Text style={[styles.principalValue, { color: Colors.success }]}>
                {formatCurrency(dashboardStats.totalPrincipalReceived, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.principalCard}>
              <Text style={styles.principalLabel}>Principal Outstanding</Text>
              <Text style={[styles.principalValue, { color: Colors.warning }]}>
                {formatCurrency(dashboardStats.totalPrincipalOutstanding, currency.code, currency.symbol)}
              </Text>
            </View>
          </View>
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
              const loan = loans.find((entry) => entry.id === installment.loanId);
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
                  testID={`overdue-payment-${installment.id}`}
                >
                  <View style={styles.paymentInfo}>
                    <Text style={styles.borrowerName}>{loan?.borrowerName ?? 'Unknown Borrower'}</Text>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(
                        installment.totalAmount - installment.paidAmount,
                        currency.code,
                        currency.symbol,
                      )}
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
              const loan = loans.find((entry) => entry.id === installment.loanId);
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
                  testID={`upcoming-payment-${installment.id}`}
                >
                  <View style={styles.paymentInfo}>
                    <Text style={styles.borrowerName}>{loan?.borrowerName ?? 'Unknown Borrower'}</Text>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(installment.totalAmount, currency.code, currency.symbol)}
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
              onPress={() => {
                console.log('Creating first loan');
                router.push('/add-loan');
              }}
              testID="empty-create-loan"
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
    paddingVertical: 16,
    paddingBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButton: {
    padding: 8,
  },
  switchButton: {
    padding: 8,
    marginLeft: 4,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
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
    minWidth: 150,
    flex: 1,
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
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    fontWeight: '600',
    color: Colors.text,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '600',
    color: Colors.info,
  },
  overdueText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  principalTrackingSection: {
    marginBottom: 24,
  },
  principalGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  principalCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  principalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  principalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
});
