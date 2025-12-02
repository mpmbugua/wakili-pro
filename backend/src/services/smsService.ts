/**
 * SMS service for sending transactional SMS messages
 * Uses AfricasTalking API for production SMS delivery
 * Logs to console in development mode
 */

import axios from 'axios';

const AFRICASTALKING_API_URL = 'https://api.sandbox.africastalking.com/version1/messaging';
const AFRICASTALKING_PROD_URL = 'https://api.africastalking.com/version1/messaging';

interface AfricasTalkingResponse {
  SMSMessageData: {
    Message: string;
    Recipients: Array<{
      statusCode: number;
      number: string;
      status: string;
      cost: string;
      messageId: string;
    }>;
  };
}

/**
 * Send an SMS message via AfricasTalking API
 * 
 * @param phoneNumber - Phone number in format +254XXXXXXXXX or 254XXXXXXXXX
 * @param message - SMS message (max 160 characters recommended)
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  // Normalize phone number to international format
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // In development, just log the SMS
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📱 [SMS SERVICE - DEV MODE]');
    console.log('━'.repeat(80));
    console.log(`To: ${normalizedPhone}`);
    console.log(`Message: ${message}`);
    console.log(`Length: ${message.length} characters`);
    console.log('━'.repeat(80));
    console.log('\n');
    return;
  }

  // Check if AfricasTalking credentials are configured
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';

  if (!apiKey) {
    console.warn('⚠️ AfricasTalking API key not configured. SMS would be sent:', {
      to: normalizedPhone,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });
    return;
  }

  try {
    // Determine API URL based on username
    const apiUrl = username === 'sandbox' ? AFRICASTALKING_API_URL : AFRICASTALKING_PROD_URL;

    // Send SMS via AfricasTalking API
    const response = await axios.post<AfricasTalkingResponse>(
      apiUrl,
      new URLSearchParams({
        username: username,
        to: normalizedPhone,
        message: message,
        from: process.env.SMS_SENDER_ID || 'WAKILIPRO'
      }).toString(),
      {
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const result = response.data;
    const recipient = result.SMSMessageData.Recipients[0];

    if (recipient.statusCode === 101) {
      console.log('✅ SMS sent successfully:', {
        to: normalizedPhone,
        status: recipient.status,
        messageId: recipient.messageId,
        cost: recipient.cost
      });
    } else {
      console.error('❌ SMS delivery failed:', {
        to: normalizedPhone,
        status: recipient.status,
        statusCode: recipient.statusCode
      });
      throw new Error(`SMS delivery failed: ${recipient.status}`);
    }
  } catch (error: any) {
    console.error('❌ AfricasTalking SMS error:', {
      message: error.message,
      response: error.response?.data,
      to: normalizedPhone
    });
    // Don't throw - allow application to continue even if SMS fails
  }
}

/**
 * Normalize phone number to international format
 * Converts 0712345678 → +254712345678
 * Converts 712345678 → +254712345678
 * Leaves +254712345678 and 254712345678 as-is
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.startsWith('254')) {
    // Already in international format without +
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    // Kenyan format starting with 0 (e.g., 0712345678)
    return `+254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    // Missing country code and leading 0 (e.g., 712345678)
    return `+254${cleaned}`;
  }

  // Already formatted correctly or unknown format - return with + if not present
  return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
}

/**
 * Send verification code via SMS
 */
export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<void> {
  const message = `Your Wakili Pro verification code is: ${code}. Valid for 10 minutes.`;
  await sendSMS(phoneNumber, message);
}

/**
 * Send appointment reminder via SMS
 */
export async function sendAppointmentReminder(
  phoneNumber: string,
  lawyerName: string,
  appointmentTime: Date
): Promise<void> {
  const formattedTime = appointmentTime.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const message = `Reminder: Your appointment with ${lawyerName} is scheduled for ${formattedTime}. See you then!`;
  await sendSMS(phoneNumber, message);
}

/**
 * Bulk SMS - send same message to multiple recipients
 * Useful for announcements or batch notifications
 */
export async function sendBulkSMS(
  phoneNumbers: string[],
  message: string
): Promise<void> {
  // In development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n📱 [BULK SMS - DEV MODE] Sending to ${phoneNumbers.length} recipients`);
    phoneNumbers.forEach(phone => console.log(`  → ${normalizePhoneNumber(phone)}`));
    console.log(`Message: ${message}\n`);
    return;
  }

  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';

  if (!apiKey) {
    console.warn(`⚠️ Bulk SMS not sent (no API key) to ${phoneNumbers.length} recipients`);
    return;
  }

  try {
    const apiUrl = username === 'sandbox' ? AFRICASTALKING_API_URL : AFRICASTALKING_PROD_URL;
    const normalizedPhones = phoneNumbers.map(normalizePhoneNumber);

    const response = await axios.post<AfricasTalkingResponse>(
      apiUrl,
      new URLSearchParams({
        username: username,
        to: normalizedPhones.join(','), // Comma-separated for bulk
        message: message,
        from: process.env.SMS_SENDER_ID || 'WAKILIPRO'
      }).toString(),
      {
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const result = response.data;
    const successful = result.SMSMessageData.Recipients.filter(r => r.statusCode === 101);
    const failed = result.SMSMessageData.Recipients.filter(r => r.statusCode !== 101);

    console.log(`✅ Bulk SMS: ${successful.length} sent, ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.warn('Failed recipients:', failed.map(r => ({ number: r.number, status: r.status })));
    }
  } catch (error: any) {
    console.error('❌ Bulk SMS error:', error.message);
  }
}

/**
 * Fetch SMS delivery reports
 * Check status of previously sent messages
 */
export async function fetchDeliveryReports(messageId?: string): Promise<any> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';

  if (!apiKey) {
    console.warn('⚠️ Cannot fetch delivery reports: API key not configured');
    return null;
  }

  try {
    const baseUrl = username === 'sandbox' 
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const params: any = { username };
    if (messageId) {
      params.messageId = messageId;
    }

    const response = await axios.get(`${baseUrl}`, {
      params,
      headers: {
        'apiKey': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Delivery reports fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching delivery reports:', error.message);
    return null;
  }
}

/**
 * Check account balance (SMS credits remaining)
 */
export async function checkBalance(): Promise<{ balance: string; currency: string } | null> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';

  if (!apiKey) {
    console.warn('⚠️ Cannot check balance: API key not configured');
    return null;
  }

  try {
    const baseUrl = username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/user'
      : 'https://api.africastalking.com/version1/user';

    const response = await axios.get(`${baseUrl}?username=${username}`, {
      headers: {
        'apiKey': apiKey,
        'Accept': 'application/json'
      }
    });

    const balanceData = response.data.UserData.balance;
    console.log(`💰 AfricasTalking Balance: ${balanceData}`);
    
    return {
      balance: balanceData.split(' ')[0],
      currency: balanceData.split(' ')[1] || 'KES'
    };
  } catch (error: any) {
    console.error('❌ Error checking balance:', error.message);
    return null;
  }
}
