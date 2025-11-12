import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { ArrowRightLeft, RefreshCw, DollarSign, TrendingUp } from 'lucide-react-native';
import { useCurrency, CURRENCIES, Currency } from '@/contexts/CurrencyContext';

import Colors from '@/constants/colors';

export default function CalculatorScreen() {
  const { currency: defaultCurrency, exchangeRates } = useCurrency();
  
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<Currency>(defaultCurrency);
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[1]);
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (exchangeRates) {
      setLastUpdated(exchangeRates.date);
    }
  }, [exchangeRates]);

  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    setIsConverting(true);
    
    const amountValue = parseFloat(amount);
    if (exchangeRates && exchangeRates.rates) {
      const fromRate = exchangeRates.rates[fromCurrency.code] || 1;
      const toRate = exchangeRates.rates[toCurrency.code] || 1;
      const rate = toRate / fromRate;
      const converted = amountValue * rate;
      
      setConversionRate(rate);
      setConvertedAmount(converted);
    }
    
    setIsConverting(false);
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
    setConversionRate(null);
  };

  const CurrencyModal = ({
    visible,
    onClose,
    onSelect,
    title,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (currency: Currency) => void;
    title: string;
  }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.currencyItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View style={styles.currencyItemLeft}>
                  <Text style={styles.currencyCode}>{item.code}</Text>
                  <Text style={styles.currencySymbol}>{item.symbol}</Text>
                </View>
                <Text style={styles.currencyName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Currency Calculator',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <DollarSign color={Colors.primary} size={48} />
          <Text style={styles.headerTitle}>Currency Converter</Text>
          <Text style={styles.headerSubtitle}>
            Convert between different currencies using live exchange rates
          </Text>
        </View>

        {lastUpdated && (
          <View style={styles.infoCard}>
            <RefreshCw color={Colors.info} size={16} />
            <Text style={styles.infoText}>Last updated: {lastUpdated}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount to Convert</Text>
          <View style={styles.inputWithIcon}>
            <DollarSign color={Colors.textSecondary} size={20} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder="Enter amount"
              placeholderTextColor={Colors.textSecondary}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setConvertedAmount(null);
                setConversionRate(null);
              }}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From Currency</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowFromModal(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <Text style={styles.currencySelectorCode}>{fromCurrency.code}</Text>
              <Text style={styles.currencySelectorSymbol}>{fromCurrency.symbol}</Text>
            </View>
            <Text style={styles.currencySelectorName}>{fromCurrency.name}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwapCurrencies}>
          <ArrowRightLeft color={Colors.primary} size={24} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To Currency</Text>
          <TouchableOpacity
            style={styles.currencySelector}
            onPress={() => setShowToModal(true)}
          >
            <View style={styles.currencySelectorLeft}>
              <Text style={styles.currencySelectorCode}>{toCurrency.code}</Text>
              <Text style={styles.currencySelectorSymbol}>{toCurrency.symbol}</Text>
            </View>
            <Text style={styles.currencySelectorName}>{toCurrency.name}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.convertButton, (!amount || parseFloat(amount) <= 0) && styles.convertButtonDisabled]}
          onPress={handleConvert}
          disabled={!amount || parseFloat(amount) <= 0 || isConverting}
        >
          {isConverting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <TrendingUp color="#FFFFFF" size={20} />
              <Text style={styles.convertButtonText}>Convert</Text>
            </>
          )}
        </TouchableOpacity>

        {convertedAmount !== null && conversionRate !== null && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>Converted Amount</Text>
              <Text style={styles.rateText}>
                1 {fromCurrency.code} = {conversionRate.toFixed(4)} {toCurrency.code}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <View style={styles.resultAmount}>
                <Text style={styles.resultAmountText}>
                  {fromCurrency.symbol} {parseFloat(amount).toFixed(2)}
                </Text>
                <Text style={styles.resultCurrency}>{fromCurrency.code}</Text>
              </View>
              <ArrowRightLeft color={Colors.textSecondary} size={20} />
              <View style={styles.resultAmount}>
                <Text style={[styles.resultAmountText, styles.resultAmountHighlight]}>
                  {toCurrency.symbol} {convertedAmount.toFixed(2)}
                </Text>
                <Text style={styles.resultCurrency}>{toCurrency.code}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.quickConversions}>
          <Text style={styles.sectionTitle}>Quick Conversions</Text>
          {exchangeRates && exchangeRates.rates ? (
            <View style={styles.quickConversionsList}>
              {[1, 10, 100, 1000].map((value) => {
                const rate = exchangeRates.rates[toCurrency.code] || 1;
                const converted = value * rate;
                return (
                  <View key={value} style={styles.quickConversionItem}>
                    <Text style={styles.quickConversionFrom}>
                      {fromCurrency.symbol} {value}
                    </Text>
                    <Text style={styles.quickConversionEquals}>=</Text>
                    <Text style={styles.quickConversionTo}>
                      {toCurrency.symbol} {converted.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Loading exchange rates...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CurrencyModal
        visible={showFromModal}
        onClose={() => setShowFromModal(false)}
        onSelect={setFromCurrency}
        title="Select From Currency"
      />

      <CurrencyModal
        visible={showToModal}
        onClose={() => setShowToModal(false)}
        onSelect={setToCurrency}
        title="Select To Currency"
      />
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.info,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWithIconText: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 18,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySelectorCode: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  currencySelectorSymbol: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  currencySelectorName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 30,
    padding: 12,
    marginVertical: 16,
  },
  convertButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  convertButtonDisabled: {
    opacity: 0.5,
  },
  convertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  resultCard: {
    backgroundColor: Colors.success + '10',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  resultHeader: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  rateText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultAmount: {
    flex: 1,
  },
  resultAmountText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultAmountHighlight: {
    color: Colors.success,
    fontSize: 24,
  },
  resultCurrency: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  quickConversions: {
    marginTop: 32,
  },
  quickConversionsList: {
    gap: 12,
  },
  quickConversionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickConversionFrom: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  quickConversionEquals: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  quickConversionTo: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  currencyName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
