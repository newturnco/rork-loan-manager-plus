import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Property,
  PropertyStatus,
  Tenant,
  RentAgreement,
  RentPayment,
  MaintenanceRequest,
  RentDashboardStats,
  PropertyExpense,
} from '@/types/rent';

const STORAGE_KEYS = {
  PROPERTIES: 'rent_properties',
  TENANTS: 'rent_tenants',
  AGREEMENTS: 'rent_agreements',
  PAYMENTS: 'rent_payments',
  MAINTENANCE: 'rent_maintenance',
  EXPENSES: 'rent_expenses',
};

export const [RentProvider, useRent] = createContextHook(() => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<RentAgreement[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [propertiesData, tenantsData, agreementsData, paymentsData, maintenanceData, expensesData] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
          AsyncStorage.getItem(STORAGE_KEYS.TENANTS),
          AsyncStorage.getItem(STORAGE_KEYS.AGREEMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE),
          AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        ]);

      if (propertiesData) setProperties(JSON.parse(propertiesData));
      if (tenantsData) setTenants(JSON.parse(tenantsData));
      if (agreementsData) setAgreements(JSON.parse(agreementsData));
      if (paymentsData) setPayments(JSON.parse(paymentsData));
      if (maintenanceData) setMaintenanceRequests(JSON.parse(maintenanceData));
      if (expensesData) setExpenses(JSON.parse(expensesData));
    } catch (error) {
      console.error('Error loading rent data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveData = useCallback(
    async (
      key: string,
      data: Property[] | Tenant[] | RentAgreement[] | RentPayment[] | MaintenanceRequest[] | PropertyExpense[],
    ) => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Error saving ${key}:`, error);
      }
    },
    [],
  );

  const addProperty = useCallback(
    (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newProperty: Property = {
        ...property,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProperties((prev) => {
        const updated = [...prev, newProperty];
        void saveData(STORAGE_KEYS.PROPERTIES, updated);
        return updated;
      });
      return newProperty;
    },
    [saveData],
  );

  const updateProperty = useCallback(
    (id: string, updates: Partial<Property>) => {
      setProperties((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
        );
        void saveData(STORAGE_KEYS.PROPERTIES, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deleteProperty = useCallback(
    (id: string) => {
      setProperties((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        void saveData(STORAGE_KEYS.PROPERTIES, updated);
        return updated;
      });
    },
    [saveData],
  );

  const addTenant = useCallback(
    (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newTenant: Tenant = {
        ...tenant,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTenants((prev) => {
        const updated = [...prev, newTenant];
        void saveData(STORAGE_KEYS.TENANTS, updated);
        return updated;
      });
      return newTenant;
    },
    [saveData],
  );

  const updateTenant = useCallback(
    (id: string, updates: Partial<Tenant>) => {
      setTenants((prev) => {
        const updated = prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
        );
        void saveData(STORAGE_KEYS.TENANTS, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deleteTenant = useCallback(
    (id: string) => {
      setTenants((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        void saveData(STORAGE_KEYS.TENANTS, updated);
        return updated;
      });
    },
    [saveData],
  );

  const addAgreement = useCallback(
    (agreement: Omit<RentAgreement, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newAgreement: RentAgreement = {
        ...agreement,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAgreements((prev) => {
        const updated = [...prev, newAgreement];
        void saveData(STORAGE_KEYS.AGREEMENTS, updated);
        return updated;
      });
      updateProperty(agreement.propertyId, { status: 'occupied' as PropertyStatus });
      return newAgreement;
    },
    [saveData, updateProperty],
  );

  const updateAgreement = useCallback(
    (id: string, updates: Partial<RentAgreement>) => {
      setAgreements((prev) => {
        const updated = prev.map((a) =>
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
        );
        void saveData(STORAGE_KEYS.AGREEMENTS, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deleteAgreement = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const agreement = prev.find((a) => a.id === id);
        if (agreement) {
          updateProperty(agreement.propertyId, { status: 'available' as PropertyStatus });
        }
        const updated = prev.filter((a) => a.id !== id);
        void saveData(STORAGE_KEYS.AGREEMENTS, updated);
        return updated;
      });
    },
    [saveData, updateProperty],
  );

  const addPayment = useCallback(
    (payment: Omit<RentPayment, 'id' | 'createdAt'>) => {
      const newPayment: RentPayment = {
        ...payment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => {
        const updated = [...prev, newPayment];
        void saveData(STORAGE_KEYS.PAYMENTS, updated);
        return updated;
      });
      return newPayment;
    },
    [saveData],
  );

  const updatePayment = useCallback(
    (id: string, updates: Partial<RentPayment>) => {
      setPayments((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        void saveData(STORAGE_KEYS.PAYMENTS, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deletePayment = useCallback(
    (id: string) => {
      setPayments((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        void saveData(STORAGE_KEYS.PAYMENTS, updated);
        return updated;
      });
    },
    [saveData],
  );

  const addMaintenanceRequest = useCallback(
    (request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newRequest: MaintenanceRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMaintenanceRequests((prev) => {
        const updated = [...prev, newRequest];
        void saveData(STORAGE_KEYS.MAINTENANCE, updated);
        return updated;
      });
      return newRequest;
    },
    [saveData],
  );

  const updateMaintenanceRequest = useCallback(
    (id: string, updates: Partial<MaintenanceRequest>) => {
      setMaintenanceRequests((prev) => {
        const updated = prev.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r,
        );
        void saveData(STORAGE_KEYS.MAINTENANCE, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deleteMaintenanceRequest = useCallback(
    (id: string) => {
      setMaintenanceRequests((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        void saveData(STORAGE_KEYS.MAINTENANCE, updated);
        return updated;
      });
    },
    [saveData],
  );

  const addExpense = useCallback(
    (expense: Omit<PropertyExpense, 'id' | 'createdAt'>) => {
      const newExpense: PropertyExpense = {
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => {
        const updated = [...prev, newExpense];
        void saveData(STORAGE_KEYS.EXPENSES, updated);
        return updated;
      });
      return newExpense;
    },
    [saveData],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<PropertyExpense>) => {
      setExpenses((prev) => {
        const updated = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        void saveData(STORAGE_KEYS.EXPENSES, updated);
        return updated;
      });
    },
    [saveData],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        void saveData(STORAGE_KEYS.EXPENSES, updated);
        return updated;
      });
    },
    [saveData],
  );

  const clearAll = useCallback(async () => {
    try {
      setProperties([]);
      setTenants([]);
      setAgreements([]);
      setPayments([]);
      setMaintenanceRequests([]);
      setExpenses([]);
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PROPERTIES,
        STORAGE_KEYS.TENANTS,
        STORAGE_KEYS.AGREEMENTS,
        STORAGE_KEYS.PAYMENTS,
        STORAGE_KEYS.MAINTENANCE,
        STORAGE_KEYS.EXPENSES,
      ]);
    } catch (error) {
      console.error('Error clearing rent data:', error);
    }
  }, []);

  const dashboardStats = useMemo<RentDashboardStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const occupiedProperties = properties.filter((p) => p.status === 'occupied').length;
    const vacantProperties = properties.filter((p) => p.status === 'available').length;

    const activeTenantIds = new Set(
      agreements.filter((a) => a.status === 'active').map((a) => a.tenantId),
    );

    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalRentCollected = paidPayments.reduce((sum, p) => sum + p.paidAmount, 0);

    const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
    const pendingRent = pendingPayments.reduce(
      (sum, p) => sum + (p.amount - p.paidAmount),
      0,
    );

    const overduePayments = payments.filter((p) => {
      if (p.status !== 'pending') return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < now;
    }).map((p) => {
      const dueDate = new Date(p.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const lateFeePerDay = (p.amount * 0.01);
      const calculatedLateFee = Math.min(lateFeePerDay * daysOverdue, p.amount * 0.1);
      return {
        ...p,
        lateFee: calculatedLateFee,
      };
    });
    const overdueRent = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount) + (p.lateFee || 0), 0);

    const monthlyIncome = paidPayments
      .filter((p) => {
        const paymentDate = new Date(p.paymentDate ?? p.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const monthlyExpenses = expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const netIncome = monthlyIncome - monthlyExpenses;

    const upcomingRentPayments = payments
      .filter((p) => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.dueDate);
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const expiringAgreements = agreements
      .filter((a) => {
        if (a.status !== 'active') return false;
        const endDate = new Date(a.endDate);
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 60;
      })
      .slice(0, 5);

    return {
      totalProperties: properties.length,
      occupiedProperties,
      vacantProperties,
      totalTenants: tenants.length,
      activeTenants: activeTenantIds.size,
      totalRentCollected,
      pendingRent,
      overdueRent,
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      upcomingRentPayments,
      overduePayments: overduePayments.slice(0, 5),
      maintenanceRequests: maintenanceRequests.filter((r) => r.status === 'pending').slice(0, 5),
      expiringAgreements,
    };
  }, [properties, tenants, agreements, payments, maintenanceRequests, expenses]);

  const refreshAll = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return useMemo(
    () => ({
      properties,
      tenants,
      agreements,
      payments,
      maintenanceRequests,
      expenses,
      isLoading,
      dashboardStats,
      addProperty,
      updateProperty,
      deleteProperty,
      addTenant,
      updateTenant,
      deleteTenant,
      addAgreement,
      updateAgreement,
      deleteAgreement,
      addPayment,
      updatePayment,
      deletePayment,
      addMaintenanceRequest,
      updateMaintenanceRequest,
      deleteMaintenanceRequest,
      addExpense,
      updateExpense,
      deleteExpense,
      refreshAll,
      clearAll,
    }),
    [
      properties,
      tenants,
      agreements,
      payments,
      maintenanceRequests,
      expenses,
      isLoading,
      dashboardStats,
      addProperty,
      updateProperty,
      deleteProperty,
      addTenant,
      updateTenant,
      deleteTenant,
      addAgreement,
      updateAgreement,
      deleteAgreement,
      addPayment,
      updatePayment,
      deletePayment,
      addMaintenanceRequest,
      updateMaintenanceRequest,
      deleteMaintenanceRequest,
      addExpense,
      updateExpense,
      deleteExpense,
      refreshAll,
      clearAll,
    ],
  );
});
