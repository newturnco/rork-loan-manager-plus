export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertSettings {
  enabled: boolean;
  daysBeforeDue: number;
  onDueDate: boolean;
  afterDueDays: number[];
  autoSendWhatsApp: boolean;
}
