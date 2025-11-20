import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  UserPlus,
  MessageCircle,
  FileSignature,
  Wallet,
  Home,
  AlertCircle,
  Calendar,
  Building2,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useResponsive } from '@/utils/responsive';

export default function RentTenantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tenants, agreements, payments, properties, deleteTenant } = useRent();
  const { currency } = useCurrency();
  const { contentMaxWidth, horizontalPadding, isTablet } = useResponsive();
  const [menuVisible, setMenuVisible] = React.useState<string | null>(null);

  const tenantInsights = React.useMemo(() => {
    const activeContracts = agreements.filter((agreement) => agreement.status === 'active');
    const pendingPayments = payments.filter((payment) => payment.status === 'pending' || payment.status === 'overdue');
    const overdueBalance = pendingPayments.reduce((total, payment) => total + (payment.amount - payment.paidAmount), 0);
    return {
      totalTenants: tenants.length,
      activeContracts: activeContracts.length,
      overdueBalance,
      pendingInvoices: pendingPayments.length,
    };
  }, [agreements, payments, tenants.length]);

  const handleEditTenant = React.useCallback((tenantId: string) => {
    setMenuVisible(null);
    router.push(`/edit-tenant?id=${tenantId}`);
  }, [router]);

  const handleDeleteTenant = React.useCallback((tenantId: string, tenantName: string) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete "${tenantName}"? This will not delete their payment history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTenant(tenantId);
          },
        },
      ]
    );
  }, [deleteTenant]);

  const handleWhatsApp = React.useCallback(
    (phone: string, message: string) => {
      const sanitized = phone.replace(/[^0-9]/g, '');
      if (!sanitized) {
        Alert.alert('Invalid number', 'Tenant phone number is missing.');
        return;
      }
      const encodedMessage = encodeURIComponent(message);
      const url = Platform.select({
        ios: `https://wa.me/${sanitized}?text=${encodedMessage}`,
        android: `https://wa.me/${sanitized}?text=${encodedMessage}`,
        default: `https://wa.me/${sanitized}?text=${encodedMessage}`,
      });
      try {
        void Linking.openURL(url ?? '');
      } catch (error) {
        console.error('[RentTenants] Unable to open WhatsApp', error);
        Alert.alert('WhatsApp unavailable', 'Unable to launch WhatsApp at the moment.');
      }
    },
    [],
  );

  const renderTenant = React.useCallback(
    ({ item }: { item: typeof tenants[number] }) => {
      const activeAgreement = agreements.find((agreement) => agreement.tenantId === item.id && agreement.status === 'active');
      const property = properties.find((prop) => prop.id === activeAgreement?.propertyId);
      const tenantPayments = payments.filter((payment) => payment.tenantId === item.id);
      const pendingPayments = tenantPayments.filter((payment) => payment.status === 'pending' || payment.status === 'overdue');
      const overdueAmount = pendingPayments.reduce((total, payment) => total + (payment.amount - payment.paidAmount), 0);
      const nextPayment = pendingPayments.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )[0];

      const reminderMessage = `Hi ${item.name}, this is a friendly reminder about your rent payment of ${formatCurrency(
        nextPayment?.amount ?? activeAgreement?.rentAmount ?? 0,
        currency.code,
        currency.symbol,
      )}${nextPayment ? ` due on ${formatDate(nextPayment.dueDate)}` : ''}. Thank you!`;

      return (
        <View style={styles.tenantCard} testID={`tenant-card-${item.id}`}>
          <View style={styles.tenantHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.tenantInfo}>
              <Text style={styles.tenantName}>{item.name}</Text>
              <Text style={styles.tenantContact}>{item.phone}</Text>
              {item.email ? <Text style={styles.tenantEmail}>{item.email}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setMenuVisible(menuVisible === item.id ? null : item.id);
              }}
              style={styles.menuButton}
              testID={`tenant-menu-${item.id}`}
            >
              <MoreVertical color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {menuVisible === item.id && (
            <View style={styles.actionsMenu}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleEditTenant(item.id)}
              >
                <Edit2 color={Colors.primary} size={18} />
                <Text style={styles.actionText}>Edit Tenant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleDeleteTenant(item.id, item.name)}
              >
                <Trash2 color={Colors.error} size={18} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Home color={Colors.primary} size={18} />
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Property</Text>
              <Text style={styles.detailValue}>{property?.name ?? 'Not assigned'}</Text>
              {property ? (
                <Text style={styles.detailHint}>{property.address}</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push('/add-rent-agreement')}
                  style={styles.assignButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.assignButtonText}>Assign Property</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Calendar color={Colors.secondary} size={18} />
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Next Due</Text>
              <Text style={[styles.detailValue, nextPayment ? styles.dueSoon : styles.onTrack]}>
                {nextPayment ? formatDate(nextPayment.dueDate) : 'All dues cleared'}
              </Text>
              {nextPayment ? (
                <Text style={styles.detailHint}>
                  {formatCurrency(nextPayment.amount - nextPayment.paidAmount, currency.code, currency.symbol)} pending
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Wallet color={Colors.warning} size={18} />
            <View style={styles.detailTextBlock}>
              <Text style={styles.detailLabel}>Outstanding</Text>
              <Text style={[styles.detailValue, overdueAmount > 0 ? styles.dueSoon : styles.onTrack]}>
                {formatCurrency(overdueAmount, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.detailHint}>{pendingPayments.length} open invoice(s)</Text>
            </View>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/record-rent-payment')}
              activeOpacity={0.85}
              testID={`tenant-record-payment-${item.id}`}
            >
              <Wallet color={Colors.primary} size={18} />
            </TouchableOpacity>
          </View>

          {item.emergencyContact ? (
            <View style={styles.detailRow}>
              <AlertCircle color={Colors.error} size={18} />
              <View style={styles.detailTextBlock}>
                <Text style={styles.detailLabel}>Emergency Contact</Text>
                <Text style={styles.detailValue}>{item.emergencyContact.name}</Text>
                <Text style={styles.detailHint}>{item.emergencyContact.phone}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleWhatsApp(item.phone, reminderMessage)}
              activeOpacity={0.9}
            >
              <MessageCircle color={Colors.primary} size={18} />
              <Text style={styles.secondaryButtonText}>Send Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/record-rent-payment')}
              activeOpacity={0.9}
            >
              <Wallet color={Colors.primary} size={18} />
              <Text style={styles.secondaryButtonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [agreements, currency.code, currency.symbol, handleWhatsApp, payments, properties, router, menuVisible, handleEditTenant, handleDeleteTenant],
  );

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}
      edges={['bottom']}
      testID="rent-tenants-screen"
    >
      <Stack.Screen
        options={{
          title: 'Tenants',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/add-tenant')}
                testID="add-tenant-button"
              >
                <UserPlus color="#FFFFFF" size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/add-rent-agreement')}
                testID="create-agreement-button"
              >
                <FileSignature color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            alignSelf: 'center',
            width: '100%',
            maxWidth: contentMaxWidth,
          },
        ]}
      >
        <View style={[styles.summaryRow, isTablet && styles.summaryRowTablet]}
          testID="tenant-summary"
        >
          <View style={styles.summaryCard}>
            <Building2 color={Colors.primary} size={20} />
            <Text style={styles.summaryValue}>{tenantInsights.totalTenants}</Text>
            <Text style={styles.summaryLabel}>Total Tenants</Text>
          </View>
          <View style={styles.summaryCard}>
            <FileSignature color={Colors.secondary} size={20} />
            <Text style={styles.summaryValue}>{tenantInsights.activeContracts}</Text>
            <Text style={styles.summaryLabel}>Active Leases</Text>
          </View>
          <View style={styles.summaryCard}>
            <Wallet color={Colors.warning} size={20} />
            <Text style={styles.summaryValue}>
              {formatCurrency(tenantInsights.overdueBalance, currency.code, currency.symbol)}
            </Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={styles.summaryCard}>
            <AlertCircle color={Colors.error} size={20} />
            <Text style={styles.summaryValue}>{tenantInsights.pendingInvoices}</Text>
            <Text style={styles.summaryLabel}>Pending Bills</Text>
          </View>
        </View>

        {tenants.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle color={Colors.textSecondary} size={64} />
            <Text style={styles.emptyTitle}>No tenants yet</Text>
            <Text style={styles.emptyText}>Create your first tenant profile to start tracking rent.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/add-tenant')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Add Tenant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tenants}
            renderItem={renderTenant}
            keyExtractor={(tenant) => tenant.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 20,
    paddingBottom: 60,
    gap: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  headerButton: {
    padding: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryRowTablet: {
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tenantCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 14,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  tenantInfo: {
    flex: 1,
    gap: 4,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tenantContact: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tenantEmail: {
    fontSize: 13,
    color: Colors.info,
  },
  menuButton: {
    padding: 8,
  },
  actionsMenu: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  detailTextBlock: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detailHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dueSoon: {
    color: Colors.warning,
  },
  onTrack: {
    color: Colors.success,
  },
  quickAction: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  assignButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  listContent: {
    paddingBottom: 20,
  },
});
