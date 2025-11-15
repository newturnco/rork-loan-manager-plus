import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Property,
  PropertyStatus,
  Tenant,
  RentAgreement,
  RentPayment,
  MaintenanceRequest,
  RentDashboardStats,
  RentPaymentStatus,
} from '@/types/rent';

const STORAGE_KEYS = {
  PROPERTIES: 'rent_properties',
  TENANTS: 'rent_tenants',
  AGREEMENTS: 'rent_agreements',
  PAYMENTS: 'rent_payments',
  MAINTENANCE: 'rent_maintenance',
};

export const [RentProvider, useRent] = createContextHook(() => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [agreements, setAgreements] = useState<RentAgreement[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [propertiesData, tenantsData, agreementsData, paymentsData, maintenanceData] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES),
          AsyncStorage.getItem(STORAGE_KEYS.TENANTS),
          AsyncStorage.getItem(STORAGE_KEYS.AGREEMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.MAINTENANCE),
        ]);

      if (propertiesData) setProperties(JSON.parse(propertiesData));
      if (tenantsData) setTenants(JSON.parse(tenantsData));
      if (agreementsData) setAgreements(JSON.parse(agreementsData));
      if (paymentsData) setPayments(JSON.parse(paymentsData));
      if (maintenanceData) setMaintenanceRequests(JSON.parse(maintenanceData));
    } catch (error) {
      console.error('Error loading rent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (
    key: string,
    data: Property[] | Tenant[] | RentAgreement[] | RentPayment[] | MaintenanceRequest[]
  ) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const addProperty = (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProperty: Property = {
      ...property,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...properties, newProperty];
    setProperties(updated);
    saveData(STORAGE_KEYS.PROPERTIES, updated);
    return newProperty;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    const updated = properties.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProperties(updated);
    saveData(STORAGE_KEYS.PROPERTIES, updated);
  };

  const deleteProperty = (id: string) => {
    const updated = properties.filter((p) => p.id !== id);
    setProperties(updated);
    saveData(STORAGE_KEYS.PROPERTIES, updated);
  };

  const addTenant = (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTenant: Tenant = {
      ...tenant,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...tenants, newTenant];
    setTenants(updated);
    saveData(STORAGE_KEYS.TENANTS, updated);
    return newTenant;
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    const updated = tenants.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    setTenants(updated);
    saveData(STORAGE_KEYS.TENANTS, updated);
  };

  const deleteTenant = (id: string) => {
    const updated = tenants.filter((t) => t.id !== id);
    setTenants(updated);
    saveData(STORAGE_KEYS.TENANTS, updated);
  };

  const addAgreement = (agreement: Omit<RentAgreement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgreement: RentAgreement = {
      ...agreement,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...agreements, newAgreement];
    setAgreements(updated);
    saveData(STORAGE_KEYS.AGREEMENTS, updated);
    
    updateProperty(agreement.propertyId, { status: 'occupied' as PropertyStatus });
    
    return newAgreement;
  };

  const updateAgreement = (id: string, updates: Partial<RentAgreement>) => {
    const updated = agreements.map((a) =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    setAgreements(updated);
    saveData(STORAGE_KEYS.AGREEMENTS, updated);
  };

  const deleteAgreement = (id: string) => {
    const agreement = agreements.find((a) => a.id === id);
    if (agreement) {
      updateProperty(agreement.propertyId, { status: 'available' as PropertyStatus });
    }
    const updated = agreements.filter((a) => a.id !== id);
    setAgreements(updated);
    saveData(STORAGE_KEYS.AGREEMENTS, updated);
  };

  const addPayment = (payment: Omit<RentPayment, 'id' | 'createdAt'>) => {
    const newPayment: RentPayment = {
      ...payment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...payments, newPayment];
    setPayments(updated);
    saveData(STORAGE_KEYS.PAYMENTS, updated);
    return newPayment;
  };

  const updatePayment = (id: string, updates: Partial<RentPayment>) => {
    const updated = payments.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPayments(updated);
    saveData(STORAGE_KEYS.PAYMENTS, updated);
  };

  const deletePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    saveData(STORAGE_KEYS.PAYMENTS, updated);
  };

  const addMaintenanceRequest = (
    request: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newRequest: MaintenanceRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...maintenanceRequests, newRequest];
    setMaintenanceRequests(updated);
    saveData(STORAGE_KEYS.MAINTENANCE, updated);
    return newRequest;
  };

  const updateMaintenanceRequest = (id: string, updates: Partial<MaintenanceRequest>) => {
    const updated = maintenanceRequests.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    setMaintenanceRequests(updated);
    saveData(STORAGE_KEYS.MAINTENANCE, updated);
  };

  const deleteMaintenanceRequest = (id: string) => {
    const updated = maintenanceRequests.filter((r) => r.id !== id);
    setMaintenanceRequests(updated);
    saveData(STORAGE_KEYS.MAINTENANCE, updated);
  };

  const dashboardStats = useMemo<RentDashboardStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const occupiedProperties = properties.filter((p) => p.status === 'occupied').length;
    const vacantProperties = properties.filter((p) => p.status === 'available').length;

    const activeTenantIds = new Set(
      agreements.filter((a) => a.status === 'active').map((a) => a.tenantId)
    );

    const paidPayments = payments.filter((p) => p.status === 'paid');
    const totalRentCollected = paidPayments.reduce((sum, p) => sum + p.paidAmount, 0);

    const pendingPayments = payments.filter(
      (p) => p.status === 'pending' || p.status === 'overdue'
    );
    const pendingRent = pendingPayments.reduce(
      (sum, p) => sum + (p.amount - p.paidAmount),
      0
    );

    const overduePayments = payments.filter((p) => {
      if (p.status !== 'pending') return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < now;
    });
    const overdueRent = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    const monthlyIncome = paidPayments
      .filter((p) => {
        const paymentDate = new Date(p.paymentDate || p.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.paidAmount, 0);

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
      upcomingRentPayments,
      overduePayments: overduePayments.slice(0, 5),
      maintenanceRequests: maintenanceRequests.filter((r) => r.status === 'pending').slice(0, 5),
      expiringAgreements,
    };
  }, [properties, tenants, agreements, payments, maintenanceRequests]);

  return {
    properties,
    tenants,
    agreements,
    payments,
    maintenanceRequests,
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
  };
});
