// Shared types for payments and billing

export interface Invoice {
  id: string;
  clientId: string;
  lawyerId: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  description?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  method: string;
}
