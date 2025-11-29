import axios from 'axios';

interface MpesaStkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface MpesaStkPushResponse {
  success: boolean;
  merchantRequestID?: string;
  checkoutRequestID?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  errorMessage?: string;
}

interface MpesaCallbackData {
  merchantRequestID: string;
  checkoutRequestID: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

/**
 * M-Pesa Daraja API Service
 * Handles STK Push (Lipa Na M-Pesa Online) payments
 */
export class MpesaService {
  private consumerKey: string;
  private consumerSecret: string;
  private shortCode: string;
  private passkey: string;
  private callbackUrl: string;
  private environment: 'sandbox' | 'production';
  private baseUrl: string;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.shortCode = process.env.MPESA_SHORTCODE || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.callbackUrl = process.env.MPESA_CALLBACK_URL || '';
    this.environment = (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    
    this.baseUrl = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error: any) {
      console.error('M-Pesa auth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Generate password for STK Push
   */
  private generatePassword(timestamp: string): string {
    const data = `${this.shortCode}${this.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Format phone number to 254XXXXXXXXX format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, hyphens, plus signs
    let cleaned = phone.replace(/[\s\-+]/g, '');
    
    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If starts with 254, keep as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    
    // If starts with 7 or 1, add 254
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    
    throw new Error('Invalid phone number format');
  }

  /**
   * Initiate STK Push payment
   */
  async initiatePayment(request: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);
      const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

      const payload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(request.amount), // M-Pesa accepts integers only
        PartyA: formattedPhone,
        PartyB: this.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ResponseCode === '0') {
        return {
          success: true,
          merchantRequestID: response.data.MerchantRequestID,
          checkoutRequestID: response.data.CheckoutRequestID,
          responseCode: response.data.ResponseCode,
          responseDescription: response.data.ResponseDescription,
          customerMessage: response.data.CustomerMessage
        };
      } else {
        return {
          success: false,
          errorMessage: response.data.ResponseDescription || 'Payment initiation failed'
        };
      }
    } catch (error: any) {
      console.error('M-Pesa STK Push error:', error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment'
      };
    }
  }

  /**
   * Query STK Push transaction status
   */
  async queryTransaction(checkoutRequestID: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('M-Pesa query error:', error.response?.data || error.message);
      throw new Error('Failed to query transaction status');
    }
  }

  /**
   * Process M-Pesa callback
   */
  processCallback(callbackData: any): MpesaCallbackData {
    const body = callbackData.Body?.stkCallback;
    
    if (!body) {
      throw new Error('Invalid callback data');
    }

    const result: MpesaCallbackData = {
      merchantRequestID: body.MerchantRequestID,
      checkoutRequestID: body.CheckoutRequestID,
      resultCode: body.ResultCode,
      resultDesc: body.ResultDesc
    };

    // If successful, extract additional data
    if (body.ResultCode === 0 && body.CallbackMetadata?.Item) {
      const items = body.CallbackMetadata.Item;
      
      items.forEach((item: any) => {
        if (item.Name === 'MpesaReceiptNumber') {
          result.mpesaReceiptNumber = item.Value;
        } else if (item.Name === 'TransactionDate') {
          result.transactionDate = item.Value?.toString();
        } else if (item.Name === 'PhoneNumber') {
          result.phoneNumber = item.Value?.toString();
        }
      });
    }

    return result;
  }

  /**
   * Validate configuration
   */
  isConfigured(): boolean {
    return !!(
      this.consumerKey &&
      this.consumerSecret &&
      this.shortCode &&
      this.passkey &&
      this.callbackUrl
    );
  }
}

export const mpesaService = new MpesaService();
