import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
  timeoutUrl: string;
}

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface STKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

interface CallbackMetadata {
  Amount: number;
  MpesaReceiptNumber: string;
  TransactionDate: number;
  PhoneNumber: string;
}

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: number | string;
        }>;
      };
    };
  };
}

class MpesaDarajaService {
  private config: MpesaConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      shortcode: process.env.MPESA_SHORTCODE || '174379',
      passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-backend.com/api/payments/mpesa/callback',
      timeoutUrl: process.env.MPESA_TIMEOUT_URL || 'https://your-backend.com/api/payments/mpesa/timeout',
    };

    this.baseUrl =
      this.config.environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    logger.info(`M-Pesa Daraja initialized in ${this.config.environment} mode`);
  }

  /**
   * Get OAuth access token from M-Pesa API
   * Tokens are valid for 3600 seconds (1 hour)
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 55 minutes (3300 seconds) to be safe
      this.tokenExpiry = Date.now() + 3300 * 1000;

      logger.info('M-Pesa access token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error('Failed to get M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa API');
    }
  }

  /**
   * Generate password for STK Push
   * Password = Base64(Shortcode + Passkey + Timestamp)
   */
  private generatePassword(timestamp: string): string {
    const password = Buffer.from(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`
    ).toString('base64');
    return password;
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces, dashes, and plus signs
    let formatted = phoneNumber.replace(/[\s\-+]/g, '');

    // If starts with 0, replace with 254
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    }

    // If starts with 7 or 1, add 254
    if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = '254' + formatted;
    }

    // If doesn't start with 254, add it
    if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }

    return formatted;
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   * This sends a payment prompt to the customer's phone
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.]/g, '')
        .substring(0, 14);
      const password = this.generatePassword(timestamp);
      const phoneNumber = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(request.amount), // M-Pesa only accepts whole numbers
        PartyA: phoneNumber,
        PartyB: this.config.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.config.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      };

      logger.info('Initiating M-Pesa STK Push:', {
        phone: phoneNumber,
        amount: request.amount,
        reference: request.accountReference,
      });

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ResponseCode === '0') {
        logger.info('STK Push initiated successfully:', {
          merchantRequestID: response.data.MerchantRequestID,
          checkoutRequestID: response.data.CheckoutRequestID,
        });
      } else {
        logger.warn('STK Push initiated with non-zero response code:', response.data);
      }

      return response.data;
    } catch (error: any) {
      logger.error('STK Push failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.errorMessage ||
          error.response?.data?.ResponseDescription ||
          'Failed to initiate M-Pesa payment'
      );
    }
  }

  /**
   * Query STK Push transaction status
   * Use this to check if customer completed payment
   */
  async querySTKPush(checkoutRequestID: string): Promise<STKQueryResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.]/g, '')
        .substring(0, 14);
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.config.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      logger.info('Querying STK Push status:', { checkoutRequestID });

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('STK Push query failed:', error.response?.data || error.message);
      throw new Error('Failed to query M-Pesa transaction status');
    }
  }

  /**
   * Process M-Pesa callback
   * This is called by Safaricom when customer completes/cancels payment
   */
  processCallback(callbackData: MpesaCallback): {
    success: boolean;
    transactionId?: string;
    amount?: number;
    phoneNumber?: string;
    merchantRequestID: string;
    checkoutRequestID: string;
    resultCode: number;
    resultDesc: string;
  } {
    const { stkCallback } = callbackData.Body;

    logger.info('Processing M-Pesa callback:', {
      merchantRequestID: stkCallback.MerchantRequestID,
      resultCode: stkCallback.ResultCode,
    });

    // ResultCode 0 = Success
    if (stkCallback.ResultCode === 0 && stkCallback.CallbackMetadata) {
      const metadata: any = {};
      stkCallback.CallbackMetadata.Item.forEach((item) => {
        metadata[item.Name] = item.Value;
      });

      return {
        success: true,
        transactionId: metadata.MpesaReceiptNumber,
        amount: metadata.Amount,
        phoneNumber: metadata.PhoneNumber?.toString(),
        merchantRequestID: stkCallback.MerchantRequestID,
        checkoutRequestID: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
      };
    }

    // Payment failed or cancelled
    return {
      success: false,
      merchantRequestID: stkCallback.MerchantRequestID,
      checkoutRequestID: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.consumerKey) {
      errors.push('MPESA_CONSUMER_KEY is not set');
    }
    if (!this.config.consumerSecret) {
      errors.push('MPESA_CONSUMER_SECRET is not set');
    }
    if (!this.config.shortcode) {
      errors.push('MPESA_SHORTCODE is not set');
    }
    if (!this.config.passkey) {
      errors.push('MPESA_PASSKEY is not set');
    }
    if (!this.config.callbackUrl.startsWith('https://')) {
      errors.push('MPESA_CALLBACK_URL must be a valid HTTPS URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const mpesaService = new MpesaDarajaService();
