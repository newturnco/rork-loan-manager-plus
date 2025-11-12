import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loan, Installment, Payment, DashboardStats, LoanStatus } from '@/types/loan';
import { generateInstallments, updateInstallmentStatus } from '@/utils/calculations';

const LOANS_KEY = '@loans';
const INSTALLMENTS_KEY = '@installments';
const PAYMENTS_KEY = '@payments';

export const [LoanProvider, useLoans] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loansQuery = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LOANS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const installmentsQuery = useQuery({
    queryKey: ['installments'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(INSTALLMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PAYMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (loansQuery.data) {
      setLoans(loansQuery.data);
    }
  }, [loansQuery.data]);

  useEffect(() => {
    if (installmentsQuery.data) {
      const updated = installmentsQuery.data.map((inst: Installment) => updateInstallmentStatus(inst));
      setInstallments(updated);
    }
  }, [installmentsQuery.data]);

  useEffect(() => {
    if (paymentsQuery.data) {
      setPayments(paymentsQuery.data);
    }
  }, [paymentsQuery.data]);

  const saveLoansMutation = useMutation({
    mutationFn: async (newLoans: Loan[]) => {
      await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(newLoans));
      return newLoans;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  const saveInstallmentsMutation = useMutation({
    mutationFn: async (newInstallments: Installment[]) => {
      await AsyncStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(newInstallments));
      return newInstallments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
    },
  });

  const savePaymentsMutation = useMutation({
    mutationFn: async (newPayments: Payment[]) => {
      await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(newPayments));
      return newPayments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const addLoan = useCallback((loan: Loan) => {
    const newLoans = [...loans, loan];
    setLoans(newLoans);
    saveLoansMutation.mutate(newLoans);

    const newInstallments = generateInstallments(loan);
    const allInstallments = [...installments, ...newInstallments];
    setInstallments(allInstallments);
    saveInstallmentsMutation.mutate(allInstallments);
  }, [loans, installments]);

  const updateLoan = useCallback((loanId: string, updates: Partial<Loan>) => {
    const newLoans = loans.map((l) => (l.id === loanId ? { ...l, ...updates } : l));
    setLoans(newLoans);
    saveLoansMutation.mutate(newLoans);
  }, [loans]);

  const deleteLoan = useCallback((loanId: string) => {
    const newLoans = loans.filter((l) => l.id !== loanId);
    setLoans(newLoans);
    saveLoansMutation.mutate(newLoans);

    const newInstallments = installments.filter((i) => i.loanId !== loanId);
    setInstallments(newInstallments);
    saveInstallmentsMutation.mutate(newInstallments);

    const newPayments = payments.filter((p) => p.loanId !== loanId);
    setPayments(newPayments);
    savePaymentsMutation.mutate(newPayments);
  }, [loans, installments, payments]);

  const recordPayment = useCallback((installmentId: string, payment: Payment) => {
    const newPayments = [...payments, payment];
    setPayments(newPayments);
    savePaymentsMutation.mutate(newPayments);

    const installment = installments.find((i) => i.id === installmentId);
    if (installment) {
      const updatedInstallment = {
        ...installment,
        paidAmount: installment.paidAmount + payment.amount,
        paidDate: payment.paymentDate,
      };
      const newInstallments = installments.map((i) =>
        i.id === installmentId ? updateInstallmentStatus(updatedInstallment) : i
      );
      setInstallments(newInstallments);
      saveInstallmentsMutation.mutate(newInstallments);

      const loan = loans.find((l) => l.id === installment.loanId);
      if (loan) {
        const loanInstallments = newInstallments.filter((i) => i.loanId === loan.id);
        const allPaid = loanInstallments.every((i) => i.status === 'paid');
        if (allPaid) {
          updateLoan(loan.id, { status: 'completed' });
        }
      }
    }
  }, [payments, installments, loans]);

  const dashboardStats = useMemo<DashboardStats>(() => {
    const activeLoans = loans.filter((l) => l.status === 'active');
    const completedLoans = loans.filter((l) => l.status === 'completed');
    const overdueLoans = loans.filter((l) => l.status === 'overdue');

    const totalAmountLent = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalAmountToReceive = installments.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalAmountReceived = installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalInterestEarned = installments
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.interestAmount, 0);
    const totalOutstanding = totalAmountToReceive - totalAmountReceived;
    
    const totalPrincipalReceived = payments.reduce((sum, p) => sum + p.principalAmount, 0);
    const totalPrincipalOutstanding = totalAmountLent - totalPrincipalReceived;

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingPayments = installments
      .filter((i) => {
        const dueDate = new Date(i.dueDate);
        return i.status === 'pending' && dueDate >= now && dueDate <= next7Days;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const overduePayments = installments
      .filter((i) => i.status === 'overdue')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      totalLoansCount: loans.length,
      activeLoansCount: activeLoans.length,
      completedLoansCount: completedLoans.length,
      overdueLoansCount: overduePayments.length,
      totalAmountLent,
      totalAmountToReceive,
      totalAmountReceived,
      totalInterestEarned,
      totalOutstanding,
      totalPrincipalReceived,
      totalPrincipalOutstanding,
      upcomingPayments,
      overduePayments,
    };
  }, [loans, installments, payments]);

  const getLoanById = useCallback((loanId: string) => {
    return loans.find((l) => l.id === loanId);
  }, [loans]);

  const getInstallmentsByLoan = useCallback((loanId: string) => {
    return installments
      .filter((i) => i.loanId === loanId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }, [installments]);

  const getPaymentsByLoan = useCallback((loanId: string) => {
    return payments
      .filter((p) => p.loanId === loanId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments]);

  return {
    loans,
    installments,
    payments,
    dashboardStats,
    addLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    getLoanById,
    getInstallmentsByLoan,
    getPaymentsByLoan,
    isLoading: loansQuery.isLoading || installmentsQuery.isLoading,
  };
});
