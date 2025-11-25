/**
 * SMS service for sending transactional SMS messages
 * Uses Africa's Talking, Twilio, or similar service in production
 * Logs to console in development
 */

/**
 * Send an SMS message
 * In production, this should use Africa's Talking, Twilio, or similar service
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

  // TODO: Production implementation
  // Example with Africa's Talking:
  /*
  const AfricasTalking = require('africastalking');
  const africastalking = AfricasTalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
  });

  const sms = africastalking.SMS;
  const result = await sms.send({
    to: [normalizedPhone],
    message: message,
    from: process.env.SMS_SENDER_ID || 'WAKILIPRO',
  });

  console.log('SMS sent:', result);
  */

  // Example with Twilio:
  /*
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: normalizedPhone,
  });
  */

  console.warn('⚠️ SMS service not configured for production. SMS would be sent:', {
    to: normalizedPhone,
    message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
  });
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
  const sendPromises = phoneNumbers.map(phone => sendSMS(phone, message));
  await Promise.all(sendPromises);
}
