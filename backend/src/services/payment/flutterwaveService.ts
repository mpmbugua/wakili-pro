import axios from 'axios';

interface FlutterwavePaymentRequest {
  amount: number; // in USD or KES
  currency?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  description: string;
  metadata?: Record<string, string>;
  redirectUrl?: string;
}

interface FlutterwavePaymentResponse {
  success: boolean;
  paymentLink?: string;
  transactionId?: string;
  errorMessage?: string;
}

/**
 * Flutterwave Payment Service
 * Handles credit/debit card payments via Flutterwave for Kenya
 */
export class FlutterwaveService {
  private secretKey: string;
  private publicKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
    this.baseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';

    if (!this.secretKey || !this.publicKey) {
      console.warn('⚠️ Flutterwave credentials not configured');
    }
  }

  /**
   * Initialize payment - creates payment link
   */
  async initiatePayment(
    request: FlutterwavePaymentRequest
  ): Promise<FlutterwavePaymentResponse> {
    try {
      const txRef = `WKL-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const payload = {
        tx_ref: txRef,
        amount: request.amount,
        currency: request.currency || 'KES',
        redirect_url: request.redirectUrl || process.env.FLUTTERWAVE_REDIRECT_URL,
        customer: {
          email: request.customerEmail,
          name: request.customerName || request.customerEmail.split('@')[0],
          phonenumber: request.customerPhone || ''
        },
        customizations: {
          title: 'Wakili Pro Payment',
          description: request.description,
          logo: 'https://wakili-pro.com/logo.png'
        },
        meta: request.metadata || {}
      };

      const response = await axios.post(
        `${this.baseUrl}/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        return {
          success: true,
          paymentLink: response.data.data.link,
          transactionId: txRef
        };
      }

      return {
        success: false,
        errorMessage: response.data.message || 'Failed to initialize payment'
      };
    } catch (error: any) {
      console.error('Flutterwave payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.message || error.message || 'Payment initialization failed'
      };
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(transactionId: string): Promise<{
    success: boolean;
    status?: 'successful' | 'failed' | 'pending';
    amount?: number;
    currency?: string;
    chargedAmount?: number;
    customerEmail?: string;
    metadata?: any;
    errorMessage?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`
          }
        }
      );

      if (response.data.status === 'success') {
        const data = response.data.data;
        return {
          success: true,
          status: data.status,
          amount: data.amount,
          currency: data.currency,
          chargedAmount: data.charged_amount,
          customerEmail: data.customer.email,
          metadata: data.meta
        };
      }

      return {
        success: false,
        errorMessage: response.data.message || 'Verification failed'
      };
    } catch (error: any) {
      console.error('Flutterwave verification error:', error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(payload: any): Promise<{
    type: string;
    transactionId?: string;
    status?: string;
    amount?: number;
    metadata?: Record<string, string>;
  }> {
    const result: any = {
      type: payload.event || 'unknown'
    };

    if (payload.event === 'charge.completed') {
      const data = payload.data;
      result.transactionId = data.tx_ref;
      result.status = data.status; // 'successful', 'failed'
      result.amount = data.amount;
      result.metadata = data.meta || {};
    }

    return result;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || '';
    return signature === secretHash;
  }

  /**
   * Calculate platform fee and lawyer payout
   */
  calculateFees(amount: number, platformFeePercent: number = 0.15): {
    total: number;
    platformFee: number;
    lawyerPayout: number;
    flutterwaveFee: number;
    netToLawyer: number;
  } {
    const total = amount;
    const platformFee = total * platformFeePercent;
    const lawyerPayout = total - platformFee;
    
    // Flutterwave fees: 1.4% for local cards + KES 25
    const flutterwaveFee = (total * 0.014) + 25;
    const netToLawyer = lawyerPayout - flutterwaveFee;

    return {
      total: Math.round(total * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      lawyerPayout: Math.round(lawyerPayout * 100) / 100,
      flutterwaveFee: Math.round(flutterwaveFee * 100) / 100,
      netToLawyer: Math.round(netToLawyer * 100) / 100
    };
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Validate configuration
   */
  isConfigured(): boolean {
    return !!(this.secretKey && this.publicKey);
  }
}

export const flutterwaveService = new FlutterwaveService();
