import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Wallet,
  AlertCircle,
  Calendar,
  MessageCircle,
  Plus,
  CheckCircle2,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useResponsive } from '@/utils/responsive';

export default function RentPaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { payments, tenants, properties, agreements, deletePayment, updatePayment } = useRent();
  const { currency } = useCurrency();
  const { contentMaxWidth, horizontalPadding, isTablet } = useResponsive();
  const [menuVisible, setMenuVisible] = React.useState<string | null>(null);

  const summaries = React.useMemo(() => {
    const collected = payments
      .filter((payment) => payment.status === 'paid')
      .reduce((total, payment) => total + payment.paidAmount, 0);
    const pending = payments
      .filter((payment) => payment.status === 'pending' || payment.status === 'partial')
      .reduce((total, payment) => total + (payment.amount - payment.paidAmount), 0);
    const overdue = payments
      .filter((payment) => payment.status === 'overdue')
      .reduce((total, payment) => total + (payment.amount - payment.paidAmount), 0);
    return { collected, pending, overdue };
  }, [payments]);

  const upcomingPayments = React.useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'pending' || payment.status === 'partial')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [payments],
  );

  const overduePayments = React.useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'overdue')
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    [payments],
  );

  const paidPayments = React.useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'paid')
        .sort((a, b) => new Date(b.paymentDate ?? b.createdAt).getTime() - new Date(a.paymentDate ?? a.createdAt).getTime())
        .slice(0, 5),
    [payments],
  );

  const handleDeletePayment = React.useCallback((paymentId: string) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePayment(paymentId);
          },
        },
      ]
    );
  }, [deletePayment]);

  const handleMarkAsPaid = React.useCallback((paymentId: string, amount: number) => {
    setMenuVisible(null);
    updatePayment(paymentId, {
      status: 'paid',
      paidAmount: amount,
      paymentDate: new Date().toISOString(),
    });
  }, [updatePayment]);

  const handleWhatsApp = React.useCallback((tenantPhone: string, message: string) => {
    const sanitized = tenantPhone.replace(/[^0-9]/g, '');
    if (!sanitized) {
      Alert.alert('Missing contact', 'This tenant does not have a valid phone number.');
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${sanitized}?text=${encodedMessage}`;
    try {
      void Linking.openURL(url);
    } catch (error) {
      console.error('[RentPayments] WhatsApp open failed', error);
      Alert.alert('WhatsApp unavailable', 'Unable to launch WhatsApp at the moment.');
    }
  }, []);

  const renderPaymentCard = React.useCallback(
    (payment: typeof payments[number]) => {
      const tenant = tenants.find((item) => item.id === payment.tenantId);
      const property = properties.find((item) => item.id === payment.propertyId);
      const agreement = agreements.find((item) => item.id === payment.agreementId);
      const outstanding = payment.amount - payment.paidAmount;
      const reminderMessage = `Hi ${tenant?.name ?? 'there'}, your rent of ${formatCurrency(payment.amount, currency.code, currency.symbol)} is due on ${formatDate(payment.dueDate)}. Kindly complete the payment.`;

      return (
        <View style={styles.paymentCard} key={payment.id} testID={`payment-card-${payment.id}`}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setMenuVisible(menuVisible === payment.id ? null : payment.id);
            }}
            style={styles.menuButton}
          >
            <MoreVertical color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          {menuVisible === payment.id && (
            <View style={styles.actionsMenu}>
              {payment.status !== 'paid' && (
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => handleMarkAsPaid(payment.id, payment.amount)}
                >
                  <CheckCircle2 color={Colors.success} size={18} />
                  <Text style={styles.actionText}>Mark as Paid</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleDeletePayment(payment.id)}
              >
                <Trash2 color={Colors.error} size={18} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.paymentHeader}>
            <View style={styles.paymentTitleBlock}>
              <Text style={styles.paymentTenant}>{tenant?.name ?? 'Tenant'}</Text>
              <Text style={styles.paymentProperty}>{property?.name ?? 'Property'}</Text>
            </View>
            <View style={[styles.statusBadge, styles[`statusBadge_${payment.status}`]]}>
              <Text style={[styles.statusText, styles[`statusText_${payment.status}`]]}>
                {payment.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Wallet color={Colors.primary} size={18} />
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(payment.amount, currency.code, currency.symbol)}</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Outstanding</Text>
              <Text style={[styles.amountValue, outstanding > 0 ? styles.outstanding : styles.cleared]}>
                {formatCurrency(outstanding, currency.code, currency.symbol)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Calendar color={Colors.secondary} size={16} />
            <Text style={styles.metaText}>Due {formatDate(payment.dueDate)}</Text>
            {payment.paymentDate ? (
              <View style={styles.metaPill}>
                <CheckCircle2 color={Colors.success} size={14} />
                <Text style={styles.metaPillText}>Paid {formatDate(payment.paymentDate)}</Text>
              </View>
            ) : null}
          </View>

          {agreement ? (
            <Text style={styles.metaSubText}>Bill day {agreement.paymentDueDay} · {agreement.rentFrequency.toUpperCase()}</Text>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWhatsApp(tenant?.phone ?? '', reminderMessage)}
              activeOpacity={0.9}
              testID={`payment-reminder-${payment.id}`}
            >
              <MessageCircle color={Colors.primary} size={18} />
              <Text style={styles.actionText}>WhatsApp Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/record-rent-payment')}
              activeOpacity={0.9}
            >
              <Plus color={Colors.primary} size={18} />
              <Text style={styles.actionText}>Log Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [agreements, currency.code, currency.symbol, handleWhatsApp, properties, router, tenants, menuVisible, handleDeletePayment, handleMarkAsPaid],
  );

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}
      testID="rent-payments-screen"
    >
      <Stack.Screen
        options={{
          title: 'Rent Payments',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/record-rent-payment')}
              testID="record-payment-button"
            >
              <Plus color="#FFFFFF" size={22} />
            </TouchableOpacity>
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
        <View style={[styles.summaryRow, isTablet && styles.summaryRowTablet]}>
          <View style={styles.summaryCard}>
            <CheckCircle2 color={Colors.success} size={20} />
            <Text style={styles.summaryValue}>{formatCurrency(summaries.collected, currency.code, currency.symbol)}</Text>
            <Text style={styles.summaryLabel}>Collected</Text>
          </View>
          <View style={styles.summaryCard}>
            <Calendar color={Colors.secondary} size={20} />
            <Text style={styles.summaryValue}>{formatCurrency(summaries.pending, currency.code, currency.symbol)}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <AlertCircle color={Colors.error} size={20} />
            <Text style={styles.summaryValue}>{formatCurrency(summaries.overdue, currency.code, currency.symbol)}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Rent</Text>
          {upcomingPayments.length === 0 ? (
            <Text style={styles.emptyLabel}>No pending payments. Everything is up to date.</Text>
          ) : (
            upcomingPayments.map((payment) => renderPaymentCard(payment))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overdue</Text>
          {overduePayments.length === 0 ? (
            <Text style={styles.emptyLabel}>No overdue invoices. Great job!</Text>
          ) : (
            overduePayments.map((payment) => renderPaymentCard(payment))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Settled</Text>
          {paidPayments.length === 0 ? (
            <Text style={styles.emptyLabel}>No recent receipts logged.</Text>
          ) : (
            paidPayments.map((payment) => renderPaymentCard(payment))
          )}
        </View>
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
    paddingVertical: 20,
    paddingBottom: 60,
    gap: 24,
  },
  headerButton: {
    padding: 8,
    marginRight: 4,
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
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentTitleBlock: {
    flex: 1,
    gap: 4,
  },
  paymentTenant: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  paymentProperty: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadge_paid: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '12',
  },
  statusBadge_pending: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '12',
  },
  statusBadge_overdue: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '12',
  },
  statusBadge_partial: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '12',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  statusText_paid: {
    color: Colors.success,
  },
  statusText_pending: {
    color: Colors.secondary,
  },
  statusText_overdue: {
    color: Colors.error,
  },
  statusText_partial: {
    color: Colors.warning,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountBlock: {
    flex: 1,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  outstanding: {
    color: Colors.error,
  },
  cleared: {
    color: Colors.success,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.success + '12',
  },
  metaPillText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  metaSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  menuButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  actionsMenu: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
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
});
