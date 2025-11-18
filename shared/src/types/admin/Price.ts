export interface Price {
  id: string;
  type: 'subscription' | 'document';
  name: string;
  amount: number;
  currency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
