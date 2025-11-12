export type InterestType = 'simple' | 'compound';
export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type LoanStatus = 'active' | 'completed' | 'overdue' | 'defaulted';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export interface Loan {
  id: string;
  customerId: string;
  borrowerName: string;
  borrowerPhone: string;
  principalAmount: number;
  interestRate: number;
  interestAmount?: number;
  interestType: InterestType;
  startDate: string;
  endDate: string;
  installmentFrequency: InstallmentFrequency;
  numberOfInstallments: number;
  status: LoanStatus;
  notes?: string;
  createdAt: string;
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  paidDate?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  loanId: string;
  installmentId: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paymentDate: string;
  method: string;
  notes?: string;
}

export interface DashboardStats {
  totalLoansCount: number;
  activeLoansCount: number;
  completedLoansCount: number;
  overdueLoansCount: number;
  totalAmountLent: number;
  totalAmountToReceive: number;
  totalAmountReceived: number;
  totalInterestEarned: number;
  totalOutstanding: number;
  upcomingPayments: Installment[];
  overduePayments: Installment[];
}

export interface MonthlyReport {
  month: string;
  loansCreated: number;
  amountLent: number;
  paymentsReceived: number;
  amountReceived: number;
  interestEarned: number;
}
