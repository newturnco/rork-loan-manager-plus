import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

const CURRENCY_KEY = '@currency';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

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

  const updateCurrency = useCallback((newCurrency: Currency) => {
    setCurrency(newCurrency);
    saveCurrencyMutation.mutate(newCurrency);
  }, []);

  return {
    currency,
    updateCurrency,
    isLoading: currencyQuery.isLoading,
  };
});
