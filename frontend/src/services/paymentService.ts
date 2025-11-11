import axios, { AxiosResponse } from 'axios';
import { ApiResponse } from '../../../shared/src/types';
import { CreatePaymentIntentData, PaymentVerificationData } from '../../../shared/src/schemas/payment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('wakili-auth-storage');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const token = parsed.state?.accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  return config;
});

interface PaymentIntent {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface PaymentVerificationResponse {
  paymentId: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  transactionId?: string;
  message?: string;
}

interface WithdrawalResponse {
  withdrawalId: string;
  status: 'INITIATED' | 'COMPLETED' | 'FAILED';
  estimatedCompletion?: string;
  transactionFee?: number;
}

interface BankDetails {
  accountNumber: string;
  bankCode: string;
  accountName: string;
  branch?: string;
}

interface PaymentProcessResult {
  paymentId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
  receiptUrl?: string;
  message?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  method: string;
  serviceTitle: string;
  serviceType: string;
  clientName: string;
  providerName: string;
  createdAt: string;
}

interface ProcessPaymentData {
  bookingId: string;
  paymentMethod: 'MPESA' | 'STRIPE_CARD' | 'BANK_TRANSFER' | 'WALLET';
  amount: number;
  phoneNumber?: string; // For M-Pesa
  cardToken?: string;   // For Stripe
}

class PaymentServiceClass {
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<ApiResponse<PaymentIntent>> {
    try {
      const response: AxiosResponse<ApiResponse<PaymentIntent>> = await apiClient.post(
        '/payments/payment-intent',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while creating payment intent'
      };
    }
  }

  async verifyPayment(data: PaymentVerificationData): Promise<ApiResponse<PaymentVerificationResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<PaymentVerificationResponse>> = await apiClient.post(
        '/payments/verify',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred during payment verification'
      };
    }
  }

  async processPayment(data: ProcessPaymentData): Promise<ApiResponse<PaymentProcessResult>> {
    try {
      const response: AxiosResponse<ApiResponse<PaymentProcessResult>> = await apiClient.post(
        '/payments/process',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Payment processing failed'
      };
    }
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
  }): Promise<ApiResponse<{
    payments: PaymentHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>> {
    try {
      const response = await apiClient.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred while fetching payment history'
      };
    }
  }

  // M-Pesa specific methods
  async initiateMpesaPayment(data: {
    bookingId: string;
    phoneNumber: string;
    amount: number;
  }): Promise<ApiResponse<PaymentProcessResult>> {
    return this.processPayment({
      bookingId: data.bookingId,
      paymentMethod: 'MPESA',
      amount: data.amount,
      phoneNumber: data.phoneNumber
    });
  }

  // Stripe specific methods
  async initiateStripePayment(data: {
    bookingId: string;
    cardToken: string;
    amount: number;
  }): Promise<ApiResponse<PaymentProcessResult>> {
    return this.processPayment({
      bookingId: data.bookingId,
      paymentMethod: 'STRIPE_CARD',
      amount: data.amount,
      cardToken: data.cardToken
    });
  }

  // Wallet operations
  async getWalletBalance(): Promise<ApiResponse<{ balance: number }>> {
    try {
      const response = await apiClient.get('/payments/wallet/balance');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to fetch wallet balance'
      };
    }
  }

  async addFundsToWallet(amount: number, paymentMethod: string): Promise<ApiResponse<{ walletBalance: number; transactionId: string }>> {
    try {
      const response = await apiClient.post('/payments/wallet/add-funds', {
        amount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to add funds to wallet'
      };
    }
  }

  async withdrawFromWallet(amount: number, bankDetails: BankDetails): Promise<ApiResponse<WithdrawalResponse>> {
    try {
      const response = await apiClient.post('/payments/wallet/withdraw', {
        amount,
        bankDetails
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Failed to process withdrawal'
      };
    }
  }

  // Payment status polling for async operations
  async pollPaymentStatus(
    paymentId: string,
    maxAttempts: number = 10,
    intervalMs: number = 3000
  ): Promise<ApiResponse<PaymentProcessResult>> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await apiClient.get(`/payments/${paymentId}/status`);
        const payment = response.data.data;
        
        if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
          return response.data;
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            message: 'Payment status check timeout'
          };
        }
      }
    }
    
    return {
      success: false,
      message: 'Payment status check timeout'
    };
  }
}

export const paymentService = new PaymentServiceClass();