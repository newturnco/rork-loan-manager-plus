import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { FileText, Download, TrendingUp, Calendar, User, X, FileSpreadsheet, Send } from 'lucide-react-native';
import { useLoans } from '@/contexts/LoanContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatCurrency, formatDate } from '@/utils/calculations';
import Colors from '@/constants/colors';
import { exportCustomerReportPDF, exportCustomerReportXLSX, shareReportViaWhatsApp, exportAllReportsXLSX, exportAllReportsPDF, CustomerReport } from '@/utils/reportGenerator';
import { useResponsive } from '@/utils/responsive';
import * as Sharing from 'expo-sharing';
import { MonthlyReport } from '@/types/loan';

export default function ReportsScreen() {
  const { loans, installments, payments } = useLoans();
  const { customers } = useCustomers();
  const { currency } = useCurrency();
  const { isFeatureLimited, isPremium } = useSubscription();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const [showCustomerReport, setShowCustomerReport] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const monthlyReports = useMemo<MonthlyReport[]>(() => {
    const reports: { [key: string]: MonthlyReport } = {};

    loans.forEach((loan) => {
      const month = new Date(loan.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      if (!reports[month]) {
        reports[month] = {
          month,
          loansCreated: 0,
          amountLent: 0,
          paymentsReceived: 0,
          amountReceived: 0,
          interestEarned: 0,
        };
      }
      reports[month].loansCreated += 1;
      reports[month].amountLent += loan.principalAmount;
    });

    payments.forEach((payment) => {
      const month = new Date(payment.paymentDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
      if (!reports[month]) {
        reports[month] = {
          month,
          loansCreated: 0,
          amountLent: 0,
          paymentsReceived: 0,
          amountReceived: 0,
          interestEarned: 0,
        };
      }
      reports[month].paymentsReceived += 1;
      reports[month].amountReceived += payment.amount;
      reports[month].interestEarned += payment.interestAmount;
    });

    return Object.values(reports).sort(
      (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
    );
  }, [loans, payments]);

  const customerReports = useMemo<CustomerReport[]>(() => {
    return customers.map((customer) => {
      const customerLoans = loans.filter((l) => l.customerId === customer.id);
      const customerInstallments = installments.filter((i) =>
        customerLoans.some((l) => l.id === i.loanId)
      );
      const customerPayments = payments.filter((p) =>
        customerLoans.some((l) => l.id === p.loanId)
      );

      const totalLent = customerLoans.reduce((sum, l) => sum + l.principalAmount, 0);
      const totalDue = customerInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
      const principalPaid = customerPayments.reduce((sum, p) => sum + p.principalAmount, 0);
      const interestPaid = customerPayments.reduce((sum, p) => sum + p.interestAmount, 0);
      const outstanding = totalDue - totalPaid;
      const activeLoans = customerLoans.filter((l) => l.status === 'active').length;
      const overduePayments = customerInstallments.filter((i) => i.status === 'overdue').length;

      return {
        customer,
        totalLent,
        totalDue,
        totalPaid,
        principalPaid,
        interestPaid,
        outstanding,
        activeLoans,
        completedLoans: customerLoans.filter((l) => l.status === 'completed').length,
        overduePayments,
        loans: customerLoans,
        payments: customerPayments,
      };
    });
  }, [customers, loans, installments, payments]);

  const selectedCustomerReport = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customerReports.find((r) => r.customer.id === selectedCustomerId);
  }, [selectedCustomerId, customerReports]);

  const overallStats = useMemo(() => {
    const totalLent = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPrincipalReceived = payments.reduce((sum, p) => sum + p.principalAmount, 0);
    const totalInterest = payments.reduce((sum, p) => sum + p.interestAmount, 0);
    const averageLoanSize = loans.length > 0 ? totalLent / loans.length : 0;

    return {
      totalLent,
      totalReceived,
      totalPrincipalReceived,
      totalInterest,
      averageLoanSize,
      totalLoans: loans.length,
      totalPayments: payments.length,
    };
  }, [loans, payments]);

  const [exportMenuVisible, setExportMenuVisible] = useState(false);

  const handleExportAllXLSX = async () => {
    if (isFeatureLimited('exportReports')) {
      Alert.alert(
        'Premium Feature',
        'Export reports is a premium feature. Upgrade to premium to export your reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => { /* Router not available here, user can upgrade from settings */ } },
        ]
      );
      return;
    }
    try {
      setIsExporting(true);
      setExportMenuVisible(false);
      const fileUri = await exportAllReportsXLSX(customerReports, overallStats, currency);
      
      if (Platform.OS !== 'web') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Complete Report (XLSX)',
            UTI: 'org.openxmlformats.spreadsheetml.sheet',
          });
        }
      }
      
      Alert.alert('Success', 'XLSX report exported successfully!');
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      Alert.alert('Error', 'Failed to export XLSX report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPDF = async () => {
    if (isFeatureLimited('exportReports')) {
      Alert.alert(
        'Premium Feature',
        'Export reports is a premium feature. Upgrade to premium to export your reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => { /* Router not available here, user can upgrade from settings */ } },
        ]
      );
      return;
    }
    try {
      setIsExporting(true);
      setExportMenuVisible(false);
      const fileUri = await exportAllReportsPDF(customerReports, overallStats, currency);
      
      if (Platform.OS !== 'web') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Export Complete Report (PDF)',
            UTI: 'public.html',
          });
        }
      }
      
      Alert.alert('Success', 'PDF report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCustomerPDF = async (report: CustomerReport) => {
    if (isFeatureLimited('exportReports')) {
      Alert.alert(
        'Premium Feature',
        'Export reports is a premium feature. Upgrade to premium to export your reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => { /* Router not available here, user can upgrade from settings */ } },
        ]
      );
      return;
    }
    try {
      setIsExporting(true);
      const fileUri = await exportCustomerReportPDF(report, currency);
      
      if (Platform.OS !== 'web') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/html',
            dialogTitle: 'Export Customer Report (HTML)',
            UTI: 'public.html',
          });
        }
      }
      
      Alert.alert('Success', 'Customer report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCustomerXLSX = async (report: CustomerReport) => {
    if (isFeatureLimited('exportReports')) {
      Alert.alert(
        'Premium Feature',
        'Export reports is a premium feature. Upgrade to premium to export your reports.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => { /* Router not available here, user can upgrade from settings */ } },
        ]
      );
      return;
    }
    try {
      setIsExporting(true);
      const fileUri = await exportCustomerReportXLSX(report, currency);
      
      if (Platform.OS !== 'web') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Customer Report',
            UTI: 'org.openxmlformats.spreadsheetml.sheet',
          });
        }
      }
      
      Alert.alert('Success', 'Customer report exported successfully!');
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendViaWhatsApp = async (report: CustomerReport) => {
    try {
      setIsExporting(true);
      const fileUri = await exportCustomerReportXLSX(report, currency);
      await shareReportViaWhatsApp(fileUri, report.customer.phone, 
        `Hello ${report.customer.name}, please find your financial report attached.`);
      Alert.alert('Success', 'Opening WhatsApp...');
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      Alert.alert('Error', 'Failed to share via WhatsApp');
    } finally {
      setIsExporting(false);
    }
  };

  const exportReport = async () => {
    const reportText = `
LendTrack Pro - Financial Report
Generated: ${formatDate(new Date().toISOString())}
Currency: ${currency.name} (${currency.symbol})

OVERALL STATISTICS
-------------------
Total Loans Created: ${overallStats.totalLoans}
Total Amount Lent: ${formatCurrency(overallStats.totalLent, currency.code, currency.symbol)}
Total Amount Received: ${formatCurrency(overallStats.totalReceived, currency.code, currency.symbol)}
Principal Received: ${formatCurrency(overallStats.totalPrincipalReceived, currency.code, currency.symbol)}
Interest Earned: ${formatCurrency(overallStats.totalInterest, currency.code, currency.symbol)}
Average Loan Size: ${formatCurrency(overallStats.averageLoanSize, currency.code, currency.symbol)}
Total Payments Received: ${overallStats.totalPayments}

MONTHLY BREAKDOWN
-----------------
${monthlyReports
  .map(
    (report) => `
${report.month}
- Loans Created: ${report.loansCreated}
- Amount Lent: ${formatCurrency(report.amountLent, currency.code, currency.symbol)}
- Payments Received: ${report.paymentsReceived}
- Amount Received: ${formatCurrency(report.amountReceived, currency.code, currency.symbol)}
- Interest Earned: ${formatCurrency(report.interestEarned, currency.code, currency.symbol)}
`
  )
  .join('\n')}

CUSTOMER REPORTS
-----------------
${customerReports
  .map(
    (report) => `
Customer: ${report.customer.name}
Phone: ${report.customer.phone}
- Total Lent: ${formatCurrency(report.totalLent, currency.code, currency.symbol)}
- Total Paid: ${formatCurrency(report.totalPaid, currency.code, currency.symbol)}
- Principal Paid: ${formatCurrency(report.principalPaid, currency.code, currency.symbol)}
- Interest Paid: ${formatCurrency(report.interestPaid, currency.code, currency.symbol)}
- Outstanding: ${formatCurrency(report.outstanding, currency.code, currency.symbol)}
- Active Loans: ${report.activeLoans}
- Overdue Payments: ${report.overduePayments}
`
  )
  .join('\n---\n')}

ACTIVE LOANS DETAILS
--------------------
${loans
  .filter((l) => l.status === 'active')
  .map((loan) => {
    const loanInstallments = installments.filter((i) => i.loanId === loan.id);
    const totalDue = loanInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = loanInstallments.reduce((sum, i) => sum + i.paidAmount, 0);
    return `
Borrower: ${loan.borrowerName}
Principal: ${formatCurrency(loan.principalAmount, currency.code, currency.symbol)}
Interest Rate: ${loan.interestRate}%
Total Due: ${formatCurrency(totalDue, currency.code, currency.symbol)}
Total Paid: ${formatCurrency(totalPaid, currency.code, currency.symbol)}
Remaining: ${formatCurrency(totalDue - totalPaid, currency.code, currency.symbol)}
Start Date: ${formatDate(loan.startDate)}
End Date: ${formatDate(loan.endDate)}
`;
  })
  .join('\n---\n')}
    `;

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lendtrack-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: reportText,
          title: 'LendTrack Pro Report',
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Reports & Analytics',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={() => setExportMenuVisible(true)} style={styles.headerButton} disabled={isExporting}>
              {isExporting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Download color="#FFFFFF" size={24} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={Colors.primary} size={24} />
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{overallStats.totalLoans}</Text>
              <Text style={styles.statLabel}>Total Loans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatCurrency(overallStats.totalLent, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.statLabel}>Total Lent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {formatCurrency(overallStats.totalReceived, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.info }]}>
                {formatCurrency(overallStats.totalPrincipalReceived, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.statLabel}>Principal Received</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                {formatCurrency(overallStats.totalInterest, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.statLabel}>Interest Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatCurrency(overallStats.averageLoanSize, currency.code, currency.symbol)}
              </Text>
              <Text style={styles.statLabel}>Avg Loan Size</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color={Colors.info} size={24} />
            <Text style={styles.sectionTitle}>Customer Reports</Text>
          </View>

          {customerReports.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText color={Colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>
                No customers yet. Start by adding customers and creating loans.
              </Text>
            </View>
          ) : (
            customerReports.map((report) => (
              <TouchableOpacity
                key={report.customer.id}
                style={styles.customerCard}
                onPress={() => {
                  setSelectedCustomerId(report.customer.id);
                  setShowCustomerReport(true);
                }}
              >
                <View style={styles.customerHeader}>
                  <View>
                    <Text style={styles.customerName}>{report.customer.name}</Text>
                    <Text style={styles.customerPhone}>{report.customer.phone}</Text>
                  </View>
                  <View style={styles.customerBadge}>
                    <Text style={styles.customerBadgeText}>{report.activeLoans} Active</Text>
                  </View>
                </View>

                <View style={styles.customerStats}>
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatLabel}>Total Lent</Text>
                    <Text style={styles.customerStatValue}>
                      {formatCurrency(report.totalLent, currency.code, currency.symbol)}
                    </Text>
                  </View>
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatLabel}>Total Paid</Text>
                    <Text style={[styles.customerStatValue, { color: Colors.success }]}>
                      {formatCurrency(report.totalPaid, currency.code, currency.symbol)}
                    </Text>
                  </View>
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatLabel}>Outstanding</Text>
                    <Text style={[styles.customerStatValue, { color: Colors.error }]}>
                      {formatCurrency(report.outstanding, currency.code, currency.symbol)}
                    </Text>
                  </View>
                </View>

                {report.overduePayments > 0 && (
                  <View style={styles.overdueWarning}>
                    <Text style={styles.overdueText}>
                      {report.overduePayments} overdue payment{report.overduePayments > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color={Colors.info} size={24} />
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          </View>

          {monthlyReports.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText color={Colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>
                No activity yet. Start creating loans to see monthly reports.
              </Text>
            </View>
          ) : (
            monthlyReports.map((report) => (
              <View key={report.month} style={styles.reportCard}>
                <Text style={styles.reportMonth}>{report.month}</Text>

                <View style={styles.reportGrid}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Loans Created</Text>
                    <Text style={styles.reportValue}>{report.loansCreated}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Amount Lent</Text>
                    <Text style={styles.reportValue}>
                      {formatCurrency(report.amountLent, currency.code, currency.symbol)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportGrid}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Payments Received</Text>
                    <Text style={styles.reportValue}>{report.paymentsReceived}</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportLabel}>Amount Received</Text>
                    <Text style={[styles.reportValue, { color: Colors.success }]}>
                      {formatCurrency(report.amountReceived, currency.code, currency.symbol)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Interest Earned</Text>
                  <Text style={[styles.reportValue, { color: Colors.secondary }]}>
                    {formatCurrency(report.interestEarned, currency.code, currency.symbol)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCustomerReport}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCustomerReport(false)}
      >
        {selectedCustomerReport && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCustomerReport.customer.name}</Text>
              <TouchableOpacity onPress={() => setShowCustomerReport(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleExportCustomerPDF(selectedCustomerReport)}
                  disabled={isExporting}
                >
                  <FileText color="#FFFFFF" size={20} />
                  <Text style={styles.actionButtonText}>Export PDF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.success }]}
                  onPress={() => handleExportCustomerXLSX(selectedCustomerReport)}
                  disabled={isExporting}
                >
                  <FileSpreadsheet color="#FFFFFF" size={20} />
                  <Text style={styles.actionButtonText}>Export XLSX</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                  onPress={() => handleSendViaWhatsApp(selectedCustomerReport)}
                  disabled={isExporting}
                >
                  <Send color="#FFFFFF" size={20} />
                  <Text style={styles.actionButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Summary</Text>
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatValue}>
                      {formatCurrency(selectedCustomerReport.totalLent, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Total Lent</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: Colors.success }]}>
                      {formatCurrency(selectedCustomerReport.totalPaid, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Total Paid</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: Colors.info }]}>
                      {formatCurrency(selectedCustomerReport.principalPaid, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Principal Paid</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: Colors.secondary }]}>
                      {formatCurrency(selectedCustomerReport.interestPaid, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Interest Paid</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <Text style={[styles.modalStatValue, { color: Colors.error }]}>
                      {formatCurrency(selectedCustomerReport.outstanding, currency.code, currency.symbol)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Outstanding</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Payment History</Text>
                {selectedCustomerReport.payments.length === 0 ? (
                  <Text style={styles.emptyText}>No payments yet</Text>
                ) : (
                  selectedCustomerReport.payments
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((payment) => (
                      <View key={payment.id} style={styles.paymentHistoryCard}>
                        <View style={styles.paymentHistoryHeader}>
                          <Text style={styles.paymentHistoryDate}>{formatDate(payment.paymentDate)}</Text>
                          <Text style={styles.paymentHistoryAmount}>
                            {formatCurrency(payment.amount, currency.code, currency.symbol)}
                          </Text>
                        </View>
                        <View style={styles.paymentHistoryDetails}>
                          <Text style={styles.paymentHistoryLabel}>
                            Principal: {formatCurrency(payment.principalAmount, currency.code, currency.symbol)}
                          </Text>
                          <Text style={styles.paymentHistoryLabel}>
                            Interest: {formatCurrency(payment.interestAmount, currency.code, currency.symbol)}
                          </Text>
                        </View>
                        <Text style={styles.paymentHistoryMethod}>{payment.method}</Text>
                        {payment.notes && (
                          <Text style={styles.paymentHistoryNotes}>{payment.notes}</Text>
                        )}
                      </View>
                    ))
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        visible={exportMenuVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setExportMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setExportMenuVisible(false)}
        >
          <View style={styles.exportMenu}>
            <Text style={styles.exportMenuTitle}>Export Report As</Text>
            <TouchableOpacity
              style={styles.exportMenuItem}
              onPress={handleExportAllPDF}
              disabled={isExporting}
            >
              <FileText color={Colors.primary} size={24} />
              <Text style={styles.exportMenuItemText}>PDF (HTML)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportMenuItem}
              onPress={handleExportAllXLSX}
              disabled={isExporting}
            >
              <FileSpreadsheet color={Colors.success} size={24} />
              <Text style={styles.exportMenuItemText}>Excel (XLSX)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportMenuItem, styles.exportMenuItemCancel]}
              onPress={() => setExportMenuVisible(false)}
            >
              <X color={Colors.textSecondary} size={24} />
              <Text style={[styles.exportMenuItemText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  customerCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  customerBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  customerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerStatItem: {
    flex: 1,
  },
  customerStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  customerStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  overdueWarning: {
    backgroundColor: Colors.error + '15',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  overdueText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  reportCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportMonth: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  reportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportItem: {
    flex: 1,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reportLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  modalStatCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paymentHistoryCard: {
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
  paymentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentHistoryDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paymentHistoryAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  paymentHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentHistoryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paymentHistoryMethod: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 4,
  },
  paymentHistoryNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportMenu: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  exportMenuTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 12,
    gap: 16,
  },
  exportMenuItemCancel: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportMenuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
