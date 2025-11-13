import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/types/customer';

const CUSTOMERS_KEY = '@customers';

export const [CustomerProvider, useCustomers] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CUSTOMERS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (customersQuery.data) {
      setCustomers(customersQuery.data);
    }
  }, [customersQuery.data]);

  const saveCustomersMutation = useMutation({
    mutationFn: async (newCustomers: Customer[]) => {
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(newCustomers));
      return newCustomers;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const { mutate: saveCustomers } = saveCustomersMutation;

  const addCustomer = useCallback((customer: Customer) => {
    const newCustomers = [...customers, customer];
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
    console.log('Customer added:', customer.id, customer.name);
  }, [customers, saveCustomers]);

  const updateCustomer = useCallback((customerId: string, updates: Partial<Customer>) => {
    const newCustomers = customers.map((c) => 
      c.id === customerId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
    console.log('Customer updated:', customerId);
  }, [customers, saveCustomers]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    console.log('[CustomerContext] Attempting to delete customer:', customerId);
    const newCustomers = customers.filter((c) => c.id !== customerId);
    console.log('[CustomerContext] Customers before delete:', customers.length);
    console.log('[CustomerContext] Customers after delete:', newCustomers.length);
    setCustomers(newCustomers);
    try {
      await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(newCustomers));
      console.log('[CustomerContext] Customer deleted and saved to storage');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error) {
      console.error('[CustomerContext] Error saving after delete:', error);
      throw error;
    }
  }, [customers, queryClient]);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find((c) => c.id === customerId);
  }, [customers]);

  return {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    isLoading: customersQuery.isLoading,
  };
});
