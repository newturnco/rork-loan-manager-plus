export interface Notification {
  id: string;
  type: 'payment_due' | 'payment_overdue' | 'payment_received' | 'reminder' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  loanId?: string;
  customerId?: string;
  installmentId?: string;
  actionUrl?: string;
}
