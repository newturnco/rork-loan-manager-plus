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
import NotificationBell from '@/components/NotificationBell';
import {
  Home,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  DollarSign,
  Building2,
  CheckCircle2,
  Wrench,
  ArrowLeft,
} from 'lucide-react-native';
import { useRent } from '@/contexts/RentContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { useResponsive } from '@/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RentDashboardScreen() {
  const router = useRouter();
  const { dashboardStats, properties, tenants } = useRent();
  const { currency } = useCurrency();
  const { isTablet, contentMaxWidth, horizontalPadding } = useResponsive();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSwitchModule = async () => {
    Alert.alert(
      'Switch Module',
      'Do you want to switch to Loan Management?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await AsyncStorage.setItem('selectedModule', 'loan');
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const StatCard = ({
    label,
    value,
    color,
    icon,
  }: {
    label: string;
    value: string | number;
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
          title: 'Rent Manager Pro',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerLeft: () => (
            <TouchableOpacity onPress={handleSwitchModule} style={styles.switchButton}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => router.push('/add-property')}
                style={styles.addButton}
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
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.header, isTablet && { alignSelf: 'center', maxWidth: contentMaxWidth, width: '100%' }]}>
          <Text style={styles.greeting}>Property Portfolio</Text>
          <Text style={styles.subtitle}>
            {properties.length === 0
              ? 'Start by adding your first property'
              : `Managing ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
          </Text>
        </View>

        <View style={[styles.statsGrid, isTablet && { alignSelf: 'center', maxWidth: contentMaxWidth, width: '100%' }]}>
          <StatCard
            label="Total Properties"
            value={dashboardStats.totalProperties}
            color={Colors.primary}
            icon={<Building2 color={Colors.primary} size={20} />}
          />
          <StatCard
            label="Occupied"
            value={dashboardStats.occupiedProperties}
            color={Colors.success}
            icon={<CheckCircle2 color={Colors.success} size={20} />}
          />
          <StatCard
            label="Vacant"
            value={dashboardStats.vacantProperties}
            color={Colors.warning}
            icon={<Home color={Colors.warning} size={20} />}
          />
          <StatCard
            label="Total Tenants"
            value={dashboardStats.totalTenants}
            color={Colors.info}
            icon={<Users color={Colors.info} size={20} />}
          />
        </View>

        <View style={styles.financeSection}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.financeGrid}>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>Rent Collected</Text>
              <Text style={[styles.financeValue, { color: Colors.success }]}>
                {formatCurrency(dashboardStats.totalRentCollected, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>Pending</Text>
              <Text style={[styles.financeValue, { color: Colors.warning }]}>
                {formatCurrency(dashboardStats.pendingRent, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>Overdue</Text>
              <Text style={[styles.financeValue, { color: Colors.error }]}>
                {formatCurrency(dashboardStats.overdueRent, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.financeCard}>
              <Text style={styles.financeLabel}>Monthly Income</Text>
              <Text style={[styles.financeValue, { color: Colors.primary }]}>
                {formatCurrency(dashboardStats.monthlyIncome, currency.code, currency.symbol)}
              </Text>
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
            {dashboardStats.overduePayments.map((payment) => {
              const property = properties.find((p) => p.id === payment.propertyId);
              const tenant = tenants.find((t) => t.id === payment.tenantId);
              return (
                <TouchableOpacity key={payment.id} style={[styles.card, styles.overdueCard]}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{property?.name || 'Unknown Property'}</Text>
                    <Text style={styles.cardSubtitle}>{tenant?.name || 'Unknown Tenant'}</Text>
                  </View>
                  <View style={styles.cardAmount}>
                    <Text style={styles.amountText}>
                      {formatCurrency(payment.amount - payment.paidAmount, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.overdueText}>Overdue</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {dashboardStats.upcomingRentPayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock color={Colors.info} size={20} />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                Upcoming Rent Payments
              </Text>
            </View>
            {dashboardStats.upcomingRentPayments.map((payment) => {
              const property = properties.find((p) => p.id === payment.propertyId);
              const tenant = tenants.find((t) => t.id === payment.tenantId);
              return (
                <TouchableOpacity key={payment.id} style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{property?.name || 'Unknown Property'}</Text>
                    <Text style={styles.cardSubtitle}>{tenant?.name || 'Unknown Tenant'}</Text>
                    <Text style={styles.dueDate}>Due: {formatDate(payment.dueDate)}</Text>
                  </View>
                  <View style={styles.cardAmount}>
                    <Text style={styles.amountText}>
                      {formatCurrency(payment.amount, currency.code, currency.symbol)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {dashboardStats.maintenanceRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wrench color={Colors.warning} size={20} />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                Pending Maintenance
              </Text>
            </View>
            {dashboardStats.maintenanceRequests.map((request) => {
              const property = properties.find((p) => p.id === request.propertyId);
              return (
                <TouchableOpacity key={request.id} style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{request.title}</Text>
                    <Text style={styles.cardSubtitle}>{property?.name || 'Unknown Property'}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                    <Text style={styles.priorityText}>{request.priority.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {properties.length === 0 && (
          <View style={styles.emptyState}>
            <Home color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>No Properties Yet</Text>
            <Text style={styles.emptyText}>
              Start managing your rental properties by adding your first property
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-property')}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.emptyButtonText}>Add First Property</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return Colors.error;
    case 'high':
      return Colors.warning;
    case 'medium':
      return Colors.info;
    default:
      return Colors.textSecondary;
  }
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
  switchButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButton: {
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
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  financeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  financeCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  financeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  financeValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.info,
    marginTop: 4,
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.error,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
