import { Loan, Installment, InterestType, InstallmentFrequency, PaymentStatus } from '@/types/loan';

export function calculateTotalInterest(
  principal: number,
  rate: number,
  interestType: InterestType,
  durationInMonths: number
): number {
  if (interestType === 'simple') {
    return (principal * rate * durationInMonths) / (100 * 12);
  } else {
    const periods = durationInMonths;
    const ratePerPeriod = rate / 12 / 100;
    const amount = principal * Math.pow(1 + ratePerPeriod, periods);
    return amount - principal;
  }
}

export function getInstallmentIntervalInDays(frequency: InstallmentFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'monthly':
      return 30;
    case 'quarterly':
      return 90;
    case 'yearly':
      return 365;
  }
}

export function generateInstallments(loan: Loan): Installment[] {
  const installments: Installment[] = [];
  const startDate = new Date(loan.startDate);
  const totalInterest = calculateTotalInterest(
    loan.principalAmount,
    loan.interestRate,
    loan.interestType,
    calculateDurationInMonths(loan.startDate, loan.endDate)
  );

  const totalAmount = loan.principalAmount + totalInterest;
  const installmentAmount = totalAmount / loan.numberOfInstallments;
  const principalPerInstallment = loan.principalAmount / loan.numberOfInstallments;
  const interestPerInstallment = totalInterest / loan.numberOfInstallments;

  const intervalDays = getInstallmentIntervalInDays(loan.installmentFrequency);

  for (let i = 0; i < loan.numberOfInstallments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + intervalDays * (i + 1));

    installments.push({
      id: `${loan.id}-inst-${i + 1}`,
      loanId: loan.id,
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString(),
      principalAmount: principalPerInstallment,
      interestAmount: interestPerInstallment,
      totalAmount: installmentAmount,
      paidAmount: 0,
      status: 'pending',
    });
  }

  return installments;
}

export function calculateDurationInMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays / 30;
}

export function updateInstallmentStatus(installment: Installment): Installment {
  const now = new Date();
  const dueDate = new Date(installment.dueDate);

  if (installment.paidAmount >= installment.totalAmount) {
    return { ...installment, status: 'paid' };
  } else if (installment.paidAmount > 0 && installment.paidAmount < installment.totalAmount) {
    return { ...installment, status: 'partial' };
  } else if (now > dueDate) {
    return { ...installment, status: 'overdue' };
  } else {
    return { ...installment, status: 'pending' };
  }
}

export function formatCurrency(amount: number, currencyCode: string = 'AED', currencySymbol: string = 'د.إ'): string {
  return `${currencySymbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateShort(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
}

export function parseDateDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

export function formatDateToISO(dateStr: string): string {
  const date = parseDateDDMMYYYY(dateStr);
  return date ? date.toISOString() : new Date().toISOString();
}

export function getDaysUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string): boolean {
  return getDaysUntil(date) < 0;
}

export function calculateInterestRate(
  principal: number,
  interestAmount: number,
  interestType: InterestType,
  durationInMonths: number
): number {
  if (interestType === 'simple') {
    return (interestAmount * 100 * 12) / (principal * durationInMonths);
  } else {
    const totalAmount = principal + interestAmount;
    const ratePerPeriod = Math.pow(totalAmount / principal, 1 / durationInMonths) - 1;
    return ratePerPeriod * 12 * 100;
  }
}

export function calculateInterestAmount(
  principal: number,
  rate: number,
  interestType: InterestType,
  durationInMonths: number
): number {
  return calculateTotalInterest(principal, rate, interestType, durationInMonths);
}
