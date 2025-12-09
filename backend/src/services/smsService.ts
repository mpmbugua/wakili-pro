/**
 * SMS service for sending transactional SMS messages
 * Uses Olympus SMS API for production SMS delivery
 * Logs to console in development mode
 */

import axios from 'axios';

const OLYMPUS_SMS_API_URL = 'https://sms.ots.co.ke/api/v3/';

interface OlympusSMSResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    cost: number;
    balance: number;
  };
  error?: string;
}

/**
 * Send an SMS message via Olympus SMS API
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

  // Check if Olympus SMS credentials are configured
  const apiKey = process.env.OLYMPUS_SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'WAKILIPRO';

  if (!apiKey) {
    console.warn('⚠️ Olympus SMS API key not configured. SMS would be sent:', {
      to: normalizedPhone,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });
    return;
  }

  try {
    // Send SMS via Olympus SMS API
    const response = await axios.post<OlympusSMSResponse>(
      `${OLYMPUS_SMS_API_URL}sms/send`,
      {
        to: normalizedPhone,
        message: message,
        sender_id: senderId
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const result = response.data;

    if (result.success) {
      console.log('✅ SMS sent successfully:', {
        to: normalizedPhone,
        messageId: result.data?.messageId,
        cost: result.data?.cost,
        balance: result.data?.balance
      });
    } else {
      console.error('❌ SMS delivery failed:', {
        to: normalizedPhone,
        error: result.error || result.message
      });
      throw new Error(`SMS delivery failed: ${result.error || result.message}`);
    }
  } catch (error: any) {
    console.error('❌ Olympus SMS error:', {
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

  const apiKey = process.env.OLYMPUS_SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'WAKILIPRO';

  if (!apiKey) {
    console.warn(`⚠️ Bulk SMS not sent (no API key) to ${phoneNumbers.length} recipients`);
    return;
  }

  try {
    const normalizedPhones = phoneNumbers.map(normalizePhoneNumber);

    // Olympus SMS API may support bulk sending
    // If not, send individually (check API documentation)
    const response = await axios.post<OlympusSMSResponse>(
      `${OLYMPUS_SMS_API_URL}sms/send-bulk`,
      {
        recipients: normalizedPhones,
        message: message,
        sender_id: senderId
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const result = response.data;

    if (result.success) {
      console.log(`✅ Bulk SMS sent to ${phoneNumbers.length} recipients`);
    } else {
      console.warn('⚠️ Bulk SMS failed:', result.error || result.message);
    }
  } catch (error: any) {
/**
 * Fetch SMS delivery reports
 * Check status of previously sent messages
 */
export async function fetchDeliveryReports(messageId?: string): Promise<any> {
  const apiKey = process.env.OLYMPUS_SMS_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ Cannot fetch delivery reports: API key not configured');
    return null;
  }

  try {
    const url = messageId 
      ? `${OLYMPUS_SMS_API_URL}sms/status/${messageId}`
      : `${OLYMPUS_SMS_API_URL}sms/reports`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Delivery reports fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching delivery reports:', error.message);
    return null;
  }
}   return null;
  }
}

/**
 * Check account balance (SMS credits remaining)
 */
export async function checkBalance(): Promise<{ balance: string; currency: string } | null> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
/**
 * Check account balance (SMS credits remaining)
 */
export async function checkBalance(): Promise<{ balance: string; currency: string } | null> {
  const apiKey = process.env.OLYMPUS_SMS_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ Cannot check balance: API key not configured');
    return null;
  }

  try {
    const response = await axios.get(`${OLYMPUS_SMS_API_URL}account/balance`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const balanceData = response.data;
    console.log(`💰 Olympus SMS Balance:`, balanceData);
    
    return {
      balance: balanceData.balance || balanceData.data?.balance || '0',
      currency: balanceData.currency || 'KES'
    };
  } catch (error: any) {
    console.error('❌ Error checking balance:', error.message);
    return null;
  }
}