import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart,
  FileText,
  TrendingUp,
  Wallet,
  AlertCircle,
  Download,
  MessageCircle,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';
import { useRent } from '@/contexts/RentContext';
import { formatCurrency } from '@/utils/calculations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useResponsive } from '@/utils/responsive';
import { useModule } from '@/contexts/ModuleContext';
import { useRouter } from 'expo-router';

export default function RentReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dashboardStats, payments } = useRent();
  const { currency } = useCurrency();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { selectedModule } = useModule();
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);

  const monthlyTrend = React.useMemo(() => {
    const buckets = new Map<string, number>();
    payments.forEach((payment) => {
      if (payment.status !== 'paid') {
        return;
      }
      const date = new Date(payment.paymentDate ?? payment.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + payment.paidAmount);
    });
    const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(-6);
  }, [payments]);

  const handleGeneratePdf = React.useCallback(async () => {
    setIsGenerating(true);
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1F2933; }
              h1 { color: #0F172A; }
              section { margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #E2E8F0; }
              th { background: #F8FAFC; }
              .tag { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #EEF2FF; color: #4338CA; font-weight: 600; }
            </style>
          </head>
          <body>
            <h1>Rent Management Summary</h1>
            <section>
              <div class="tag">Module: ${selectedModule === 'rent' ? 'Rent Management' : 'Loan Management'}</div>
            </section>
            <section>
              <h2>Portfolio Snapshot</h2>
              <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Properties</td><td>${dashboardStats.totalProperties}</td></tr>
                <tr><td>Occupied Properties</td><td>${dashboardStats.occupiedProperties}</td></tr>
                <tr><td>Vacant Properties</td><td>${dashboardStats.vacantProperties}</td></tr>
                <tr><td>Total Tenants</td><td>${dashboardStats.totalTenants}</td></tr>
                <tr><td>Monthly Income</td><td>${formatCurrency(dashboardStats.monthlyIncome, currency.code, currency.symbol)}</td></tr>
                <tr><td>Pending Rent</td><td>${formatCurrency(dashboardStats.pendingRent, currency.code, currency.symbol)}</td></tr>
                <tr><td>Overdue Rent</td><td>${formatCurrency(dashboardStats.overdueRent, currency.code, currency.symbol)}</td></tr>
              </table>
            </section>
            <section>
              <h2>Recent Collections</h2>
              <table>
                <tr><th>Period</th><th>Collected</th></tr>
                ${monthlyTrend
                  .map(
                    ([period, amount]) => `<tr><td>${period}</td><td>${formatCurrency(amount, currency.code, currency.symbol)}</td></tr>`,
                  )
                  .join('')}
              </table>
            </section>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Rent Summary PDF',
        });
      } else {
        Alert.alert('PDF ready', `Saved to ${uri}`);
      }
    } catch (error) {
      console.error('[RentReports] PDF generation failed', error);
      Alert.alert('Error', 'Unable to generate the report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [currency.code, currency.symbol, dashboardStats, monthlyTrend, selectedModule]);

  const handleShareSummary = React.useCallback(() => {
    const summary = `Rent Portfolio Snapshot:
Total Properties: ${dashboardStats.totalProperties}
Occupied: ${dashboardStats.occupiedProperties}
Vacant: ${dashboardStats.vacantProperties}
Monthly Income: ${formatCurrency(dashboardStats.monthlyIncome, currency.code, currency.symbol)}
Pending: ${formatCurrency(dashboardStats.pendingRent, currency.code, currency.symbol)}
Overdue: ${formatCurrency(dashboardStats.overdueRent, currency.code, currency.symbol)}`;
    try {
      const encoded = encodeURIComponent(summary);
      const url = `https://wa.me/?text=${encoded}`;
      void Linking.openURL(url);
    } catch (error) {
      console.error('[RentReports] Share summary failed', error);
      Alert.alert('Error', 'Unable to open WhatsApp right now.');
    }
  }, [currency.code, currency.symbol, dashboardStats]);

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}
      testID="rent-reports-screen"
    >
      <Stack.Screen
        options={{
          title: 'Reports & Analytics',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
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
        <View style={styles.heroCard}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Portfolio Snapshot</Text>
            <Text style={styles.heroSubtitle}>Visualise rent performance, occupancy, and cash flow trends.</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <TrendingUp color="#FFFFFF" size={20} />
              <Text style={styles.heroStatLabel}>Monthly Income</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(dashboardStats.monthlyIncome, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Wallet color="#FFFFFF" size={20} />
              <Text style={styles.heroStatLabel}>Pending</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(dashboardStats.pendingRent, currency.code, currency.symbol)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <AlertCircle color="#FFFFFF" size={20} />
              <Text style={styles.heroStatLabel}>Overdue</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(dashboardStats.overdueRent, currency.code, currency.symbol)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Properties</Text>
            <Text style={styles.metricValue}>{dashboardStats.totalProperties}</Text>
            <Text style={styles.metricMeta}>{dashboardStats.occupiedProperties} occupied / {dashboardStats.vacantProperties} vacant</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Agreements</Text>
            <Text style={styles.metricValue}>{dashboardStats.expiringAgreements.length}</Text>
            <Text style={styles.metricMeta}>Expiring within 60 days</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Maintenance</Text>
            <Text style={styles.metricValue}>{dashboardStats.maintenanceRequests.length}</Text>
            <Text style={styles.metricMeta}>Pending open requests</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections Trend</Text>
            <BarChart color={Colors.primary} size={18} />
          </View>
          {monthlyTrend.length === 0 ? (
            <Text style={styles.emptyLabel}>No payments recorded yet.</Text>
          ) : (
            <View style={styles.trendGrid}>
              {monthlyTrend.map(([period, amount]) => (
                <View key={period} style={styles.trendBar}>
                  <View style={[styles.trendBarFill, { height: Math.min(100, amount / (dashboardStats.monthlyIncome || 1) * 80 + 20) }]} />
                  <Text style={styles.trendLabel}>{period}</Text>
                  <Text style={styles.trendValue}>{formatCurrency(amount, currency.code, currency.symbol)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overdue Payments</Text>
            <AlertCircle color={Colors.error} size={18} />
          </View>
          {dashboardStats.overduePayments.length === 0 ? (
            <Text style={styles.emptyLabel}>No overdue rent right now.</Text>
          ) : (
            dashboardStats.overduePayments.map((payment) => (
              <View key={payment.id} style={styles.overdueCard}>
                <Text style={styles.overdueAmount}>
                  {formatCurrency(payment.amount - payment.paidAmount, currency.code, currency.symbol)}
                </Text>
                <Text style={styles.overdueMeta}>Due {payment.dueDate}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryButton, isGenerating && styles.primaryButtonDisabled]}
            onPress={handleGeneratePdf}
            disabled={isGenerating}
            activeOpacity={0.9}
            testID="generate-rent-report-pdf"
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Download color="#FFFFFF" size={18} />
                <Text style={styles.primaryButtonText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShareSummary}
            activeOpacity={0.9}
            testID="share-rent-summary"
          >
            <MessageCircle color={Colors.primary} size={18} />
            <Text style={styles.secondaryButtonText}>Share WhatsApp Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/record-rent-payment')}
            activeOpacity={0.9}
          >
            <FileText color={Colors.primary} size={18} />
            <Text style={styles.secondaryButtonText}>Log Payment</Text>
          </TouchableOpacity>
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
    gap: 28,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  heroTextBlock: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  heroStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metricMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  trendGrid: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.secondary,
  },
  trendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trendValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  overdueCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.error + '12',
    borderWidth: 1,
    borderColor: Colors.error + '40',
    gap: 6,
  },
  overdueAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  overdueMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryButton: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    flexGrow: 1,
    flexBasis: 180,
    backgroundColor: Colors.primary + '12',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
