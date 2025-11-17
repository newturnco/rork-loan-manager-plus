import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getExchangeRates, ExchangeRatesData } from '../services/ExchangeRateService';

const CURRENCY_KEY = '@currency';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export type ExchangeRates = ExchangeRatesData;

export const CURRENCIES: Currency[] = [
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
];

const defaultCurrency: Currency = CURRENCIES[0];
const SUPPORTED_CURRENCY_CODES = CURRENCIES.map((item) => item.code);

export const [CurrencyProvider, useCurrency] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  const currencyQuery = useQuery({
    queryKey: ['currency'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CURRENCY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return CURRENCIES.find((c) => c.code === parsed.code) || defaultCurrency;
      }
      return defaultCurrency;
    },
  });

  useEffect(() => {
    if (currencyQuery.data) {
      setCurrency(currencyQuery.data);
    }
  }, [currencyQuery.data]);

  const saveCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: Currency) => {
      await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(newCurrency));
      return newCurrency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency'] });
    },
  });

  const { mutate: persistCurrency } = saveCurrencyMutation;

  const exchangeRatesQuery = useQuery<ExchangeRates>({
    queryKey: ['exchange-rates', currency.code],
    queryFn: async () => getExchangeRates(currency.code, SUPPORTED_CURRENCY_CODES),
    enabled: currency.code.length > 0,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  const updateCurrency = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency);
    persistCurrency(newCurrency);
  }, [persistCurrency]);

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency || !exchangeRatesQuery.data) {
        return amount;
      }

      const rates = exchangeRatesQuery.data.rates;
      
      if (exchangeRatesQuery.data.base === fromCurrency) {
        const rate = rates[toCurrency];
        return rate ? Math.round(amount * rate * 100) / 100 : amount;
      }
      
      const fromRate = rates[fromCurrency];
      const toRate = rates[toCurrency];
      
      if (fromRate && toRate) {
        const amountInBase = amount / fromRate;
        return Math.round(amountInBase * toRate * 100) / 100;
      }
      
      return amount;
    },
    [exchangeRatesQuery.data]
  );

  const getExchangeRate = useCallback(
    (fromCurrency: string, toCurrency: string): number => {
      if (fromCurrency === toCurrency || !exchangeRatesQuery.data) {
        return 1;
      }

      const rates = exchangeRatesQuery.data.rates;
      
      if (exchangeRatesQuery.data.base === fromCurrency) {
        return rates[toCurrency] || 1;
      }
      
      const fromRate = rates[fromCurrency];
      const toRate = rates[toCurrency];
      
      if (fromRate && toRate) {
        return toRate / fromRate;
      }
      
      return 1;
    },
    [exchangeRatesQuery.data]
  );

  const value = useMemo(
    () => ({
      currency,
      updateCurrency,
      convertAmount,
      getExchangeRate,
      exchangeRates: exchangeRatesQuery.data,
      isLoading: currencyQuery.isLoading,
      isLoadingRates: exchangeRatesQuery.isLoading,
    }),
    [
      currency,
      updateCurrency,
      convertAmount,
      getExchangeRate,
      exchangeRatesQuery.data,
      currencyQuery.isLoading,
      exchangeRatesQuery.isLoading,
    ],
  );

  return value;
});
