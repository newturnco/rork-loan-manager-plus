import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  DollarSign,
  Calendar,
  Phone,
  MessageCircle,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
} from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, formatDate, getDaysUntil, isOverdue } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { Installment } from '@/types/loan';

export default function LoanDetailsScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { getLoanById, getInstallmentsByLoan, getPaymentsByLoan, deleteLoan, deletePayment } = useLoans();
  const { currency } = useCurrency();

  const loan = getLoanById(loanId);
  const installments = getInstallmentsByLoan(loanId);
  const loanPayments = getPaymentsByLoan(loanId);

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

  const totalAmount = installments.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalRemaining = totalAmount - totalPaid;
  const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  const handleDelete = () => {
    Alert.alert(
      'Delete Loan',
      'Are you sure you want to delete this loan and all its installments? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[iOS/Web] Deleting loan:', loanId);
              await deleteLoan(loanId);
              await new Promise(resolve => setTimeout(resolve, 150));
              console.log('[iOS/Web] Loan deleted, navigating back');
              
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/loans');
              }

              requestAnimationFrame(() => {
                Alert.alert('Success', 'Loan deleted successfully');
              });
            } catch (error) {
              console.error('[iOS/Web] Error deleting loan:', error);
              Alert.alert('Error', 'Failed to delete loan');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleCall = () => {
    Linking.openURL(`tel:${loan.borrowerPhone}`);
  };

  const sendWhatsAppReminder = (installment: Installment) => {
    const message = `Hi ${loan.borrowerName}, this is a friendly reminder about your loan payment.\n\nInstallment #${installment.installmentNumber}\nDue Date: ${formatDate(installment.dueDate)}\nAmount Due: ${formatCurrency(installment.totalAmount - installment.paidAmount, currency.code, currency.symbol)}\n\nThank you!`;
    
    const phoneNumber = loan.borrowerPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  const getInstallmentIcon = (installment: Installment) => {
    switch (installment.status) {
      case 'paid':
        return <CheckCircle color={Colors.success} size={24} />;
      case 'overdue':
        return <AlertCircle color={Colors.error} size={24} />;
      case 'partial':
        return <Clock color={Colors.partial} size={24} />;
      case 'pending':
        return <Clock color={Colors.pending} size={24} />;
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'overdue':
        return Colors.error;
      case 'partial':
        return Colors.partial;
      case 'pending':
        return Colors.pending;
    }
  };

  const InstallmentCard = ({ installment }: { installment: Installment }) => {
    const remaining = installment.totalAmount - installment.paidAmount;
    const daysUntil = getDaysUntil(installment.dueDate);

    return (
      <View style={styles.installmentCard}>
        <View style={styles.installmentHeader}>
          <View style={styles.installmentNumber}>
            {getInstallmentIcon(installment)}
            <Text style={styles.installmentNumberText}>
              Installment #{installment.installmentNumber}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getInstallmentStatusColor(installment.status) + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getInstallmentStatusColor(installment.status) },
              ]}
            >
              {installment.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.installmentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{formatDate(installment.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(installment.totalAmount, currency.code, currency.symbol)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid Amount</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>
              {formatCurrency(installment.paidAmount, currency.code, currency.symbol)}
            </Text>
          </View>
          {remaining > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining</Text>
              <Text style={[styles.detailValue, { color: Colors.error }]}>
                {formatCurrency(remaining, currency.code, currency.symbol)}
              </Text>
            </View>
          )}
        </View>

        {installment.status !== 'paid' && (
          <View style={styles.installmentActions}>
            {isOverdue(installment.dueDate) ? (
              <Text style={styles.overdueText}>
                {Math.abs(daysUntil)} days overdue
              </Text>
            ) : (
              <Text style={styles.dueText}>
                {daysUntil === 0
                  ? 'Due today'
                  : daysUntil === 1
                  ? 'Due tomorrow'
                  : `Due in ${daysUntil} days`}
              </Text>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => sendWhatsAppReminder(installment)}
              >
                <MessageCircle color={Colors.success} size={18} />
                <Text style={styles.actionButtonText}>Remind</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={() =>
                  router.push({
                    pathname: '/add-payment',
                    params: { loanId, installmentId: installment.id },
                  })
                }
              >
                <DollarSign color="#FFFFFF" size={18} />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                  Record Payment
                </Text>
              </TouchableOpacity>
            </View>
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
          title: loan.borrowerName,
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/edit-loan', params: { loanId } })
                }
                style={styles.iconButton}
              >
                <Edit color="#FFFFFF" size={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <Trash2 color={Colors.error} size={24} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.loanCard}>
          <View style={styles.loanHeader}>
            <View>
              <Text style={styles.borrowerName}>{loan.borrowerName}</Text>
              <TouchableOpacity
                style={styles.phoneContainer}
                onPress={handleCall}
              >
                <Phone color={Colors.info} size={16} />
                <Text style={styles.phoneText}>{loan.borrowerPhone}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.amountSection}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Principal</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(loan.principalAmount, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Due</Text>
              <Text style={styles.amountValue}>{formatCurrency(totalAmount, currency.code, currency.symbol)}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Paid</Text>
              <Text style={[styles.amountValue, { color: Colors.success }]}>
                {formatCurrency(totalPaid, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[styles.amountValue, { color: Colors.error }]}>
                {formatCurrency(totalRemaining, currency.code, currency.symbol)}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: Colors.success },
                ]}
              />
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interest Rate</Text>
              <Text style={styles.detailValue}>
                {loan.interestRate}% ({loan.interestType})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{formatDate(loan.startDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{formatDate(loan.endDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>
                {loan.installmentFrequency.charAt(0).toUpperCase() +
                  loan.installmentFrequency.slice(1)}
              </Text>
            </View>
          </View>

          {loan.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{loan.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.installmentsSection}>
          <Text style={styles.sectionTitle}>Installments</Text>
          {installments.map((installment) => (
            <InstallmentCard key={installment.id} installment={installment} />
          ))}
        </View>

        {loanPayments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {loanPayments.map((payment) => {
              const installment = installments.find((i) => i.id === payment.installmentId);
              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <View>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount, currency.code, currency.symbol)}
                      </Text>
                      <Text style={styles.paymentDate}>
                        {formatDate(payment.paymentDate)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Delete Payment',
                          'Are you sure you want to delete this payment?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  console.log('[iOS] Deleting payment:', payment.id);
                                  await deletePayment(payment.id);
                                  console.log('[iOS] Payment deleted');
                                } catch (error) {
                                  console.error('[iOS] Error deleting payment:', error);
                                  Alert.alert('Error', 'Failed to delete payment');
                                }
                              },
                            },
                          ],
                          { cancelable: false }
                        );
                      }}
                      style={styles.deletePaymentButton}
                    >
                      <Trash2 color={Colors.error} size={20} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.paymentBreakdown}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Principal</Text>
                      <Text style={styles.paymentValue}>
                        {formatCurrency(payment.principalAmount, currency.code, currency.symbol)}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Interest</Text>
                      <Text style={styles.paymentValue}>
                        {formatCurrency(payment.interestAmount, currency.code, currency.symbol)}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Installment</Text>
                      <Text style={styles.paymentValue}>
                        #{installment?.installmentNumber || '-'}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Method</Text>
                      <Text style={styles.paymentValue}>{payment.method}</Text>
                    </View>
                    {payment.notes && (
                      <View style={styles.paymentNotes}>
                        <Text style={styles.paymentNotesLabel}>Notes:</Text>
                        <Text style={styles.paymentNotesText}>{payment.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
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
  iconButton: {
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loanCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  loanHeader: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  borrowerName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 16,
    color: Colors.info,
    fontWeight: '500' as const,
  },
  amountSection: {
    marginBottom: 20,
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  progressSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  detailsSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  installmentsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  installmentCard: {
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
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  installmentNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installmentNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  installmentDetails: {
    marginBottom: 12,
  },
  installmentActions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  overdueText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
    marginBottom: 12,
  },
  dueText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    gap: 6,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
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
  paymentsSection: {
    marginBottom: 16,
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.success,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  deletePaymentButton: {
    padding: 8,
  },
  paymentBreakdown: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paymentNotes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentNotesLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  paymentNotesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
