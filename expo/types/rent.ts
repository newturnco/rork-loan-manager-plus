export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'other';
export type PropertyStatus = 'available' | 'occupied' | 'maintenance' | 'unavailable';
export type RentFrequency = 'monthly' | 'quarterly' | 'yearly';
export type AgreementStatus = 'active' | 'expired' | 'terminated' | 'upcoming';
export type RentPaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  images?: string[];
  purchasePrice?: number;
  currentValue?: number;
  status: PropertyStatus;
  amenities?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  occupation?: string;
  companyName?: string;
  identityProof?: {
    type: string;
    number: string;
    document?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentAgreement {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  maintenanceCharges?: number;
  rentFrequency: RentFrequency;
  paymentDueDay: number;
  status: AgreementStatus;
  terms?: string;
  documents?: string[];
  autoRenewal?: boolean;
  noticePeriod?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RentPayment {
  id: string;
  agreementId: string;
  propertyId: string;
  tenantId: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  lateFee?: number;
  paymentDate?: string;
  status: RentPaymentStatus;
  method?: string;
  transactionId?: string;
  notes?: string;
  receipt?: string;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: MaintenanceStatus;
  images?: string[];
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PropertyExpense {
  id: string;
  propertyId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  vendor?: string;
  receipt?: string;
  recurring?: boolean;
  createdAt: string;
}

export interface PropertyDocument {
  id: string;
  propertyId: string;
  type: string;
  name: string;
  url: string;
  uploadDate: string;
}

export interface RentDashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  totalTenants: number;
  activeTenants: number;
  totalRentCollected: number;
  pendingRent: number;
  overdueRent: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  upcomingRentPayments: RentPayment[];
  overduePayments: RentPayment[];
  maintenanceRequests: MaintenanceRequest[];
  expiringAgreements: RentAgreement[];
}
