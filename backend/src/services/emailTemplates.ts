/**
 * Email HTML Templates for Wakili Pro
 * Professional, responsive email templates for all transactional emails
 */

import { sendEmail } from './emailService';

// ========================================
// BOOKING-RELATED EMAIL TEMPLATES
// ========================================

export async function sendBookingConfirmationEmail(
  clientEmail: string,
  clientName: string,
  lawyerName: string,
  booking: {
    id: string;
    consultationType: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    totalAmount: number;
  }
): Promise<void> {
  const subject = '✅ Consultation Booking Confirmed - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .booking-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #667eea; display: inline-block; width: 150px; }
        .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <p>Your consultation with <strong>${lawyerName}</strong> has been successfully confirmed.</p>
          
          <div class="booking-details">
            <h3 style="margin-top: 0;">📋 Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${booking.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span>${booking.consultationType.replace('_', ' ')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled:</span>
              <span>${new Date(booking.scheduledStartTime).toLocaleString('en-KE', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span>${Math.round((booking.scheduledEndTime.getTime() - booking.scheduledStartTime.getTime()) / (1000 * 60))} minutes</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid:</span>
              <span style="font-size: 18px; font-weight: bold; color: #28a745;">KES ${booking.totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <p><strong>What's Next?</strong></p>
          <ul style="line-height: 1.8;">
            <li>You'll receive a reminder 15 minutes before the consultation</li>
            <li>Join the consultation via your dashboard</li>
            <li>Have your questions and documents ready</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking Details</a>
          </div>
          
          <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <strong>💡 Note:</strong> If you need to reschedule or cancel, please do so at least 24 hours in advance to avoid cancellation fees.
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: clientEmail, subject, html });
}

export async function sendBookingConfirmationToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  clientName: string,
  booking: {
    id: string;
    consultationType: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    totalAmount: number;
  }
): Promise<void> {
  const subject = '📅 New Booking Received - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .booking-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #667eea; display: inline-block; width: 150px; }
        .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 New Booking!</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>You have a new consultation booking from <strong>${clientName}</strong>.</p>
          
          <div class="booking-details">
            <h3 style="margin-top: 0;">📋 Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${booking.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Client:</span>
              <span>${clientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span>${booking.consultationType.replace('_', ' ')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled:</span>
              <span>${new Date(booking.scheduledStartTime).toLocaleString('en-KE', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span>${Math.round((booking.scheduledEndTime.getTime() - booking.scheduledStartTime.getTime()) / (1000 * 60))} minutes</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Earnings (Pending):</span>
              <span style="font-size: 18px; font-weight: bold; color: #28a745;">KES ${booking.totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="alert">
            <strong>⏰ Reminder:</strong> You'll receive a notification 15 minutes before the consultation starts.
          </div>
          
          <p><strong>Preparation Checklist:</strong></p>
          <ul style="line-height: 1.8;">
            <li>Review the client's information in your dashboard</li>
            <li>Prepare relevant materials for the consultation</li>
            <li>Ensure your equipment and internet connection are ready</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">View Booking Details</a>
          </div>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

export async function sendBookingReminderEmail(
  recipientEmail: string,
  recipientName: string,
  role: 'client' | 'lawyer',
  otherPartyName: string,
  booking: {
    id: string;
    consultationType: string;
    scheduledStartTime: Date;
  }
): Promise<void> {
  const subject = '⏰ Reminder: Consultation Starting in 15 Minutes';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .reminder-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .time { font-size: 36px; font-weight: bold; color: #f5576c; margin: 15px 0; }
        .button { display: inline-block; background: #f5576c; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; font-weight: bold; }
        .checklist { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Starting Soon!</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          
          <div class="reminder-box">
            <h2 style="margin-top: 0; color: #f5576c;">Your consultation is starting in</h2>
            <div class="time">15 MINUTES</div>
            <p style="margin: 10px 0;"><strong>${role === 'client' ? 'Lawyer' : 'Client'}:</strong> ${otherPartyName}</p>
            <p style="margin: 10px 0;"><strong>Type:</strong> ${booking.consultationType.replace('_', ' ')}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${new Date(booking.scheduledStartTime).toLocaleString('en-KE', { 
              dateStyle: 'medium', 
              timeStyle: 'short',
              timeZone: 'Africa/Nairobi'
            })}</p>
          </div>
          
          <div class="checklist">
            <h3 style="margin-top: 0;">✅ Quick Checklist:</h3>
            <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">
              ${booking.consultationType === 'VIDEO_CALL' ? `
                <li>Test your camera and microphone</li>
                <li>Ensure stable internet connection</li>
                <li>Find a quiet, well-lit space</li>
              ` : booking.consultationType === 'PHONE_CALL' ? `
                <li>Ensure your phone is charged</li>
                <li>Find a quiet location</li>
                <li>Have a notepad ready</li>
              ` : `
                <li>Confirm the meeting location</li>
                <li>Bring necessary documents</li>
                <li>Arrive 5 minutes early</li>
              `}
              <li>Have your questions ready</li>
              <li>Gather relevant documents</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/bookings/${booking.id}" class="button">Join Consultation Now</a>
          </div>
          
          <p style="text-align: center; font-size: 18px; color: #667eea; margin-top: 30px;">
            <strong>See you soon! 👋</strong>
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: recipientEmail, subject, html });
}

export async function sendPaymentConfirmationEmail(
  clientEmail: string,
  clientName: string,
  payment: {
    bookingId: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
  }
): Promise<void> {
  const subject = '✅ Payment Confirmed - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #38ef7d; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #11998e; display: inline-block; width: 150px; }
        .amount { font-size: 36px; font-weight: bold; color: #38ef7d; text-align: center; margin: 20px 0; }
        .checkmark { font-size: 64px; text-align: center; color: #38ef7d; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Received!</h1>
        </div>
        <div class="content">
          <div class="checkmark">✓</div>
          <p style="text-align: center; font-size: 18px; margin: 0 0 20px 0;">Dear ${clientName},</p>
          
          <p style="text-align: center;">We have successfully received your payment.</p>
          
          <div class="payment-details">
            <h3 style="margin-top: 0; text-align: center;">💳 Payment Receipt</h3>
            <div class="amount">KES ${payment.amount.toLocaleString()}</div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span>${payment.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span>${payment.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${payment.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date().toLocaleString('en-KE', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}</span>
            </div>
          </div>
          
          <p style="padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #0c5460;">
            <strong>✅ Next Step:</strong> Your booking is now confirmed. You'll receive a separate email with consultation details shortly.
          </p>
          
          <p style="text-align: center; margin-top: 30px;">
            <strong>Need Help?</strong><br>
            Contact our support team if you have any questions.
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: clientEmail, subject, html });
}

// ========================================
// WITHDRAWAL-RELATED EMAIL TEMPLATES
// ========================================

export async function sendWithdrawalRequestConfirmation(
  lawyerEmail: string,
  lawyerName: string,
  withdrawal: {
    id: string;
    amount: number;
    withdrawalMethod: string;
    mpesaPhoneNumber?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
  }
): Promise<void> {
  const subject = '📤 Withdrawal Request Submitted - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .withdrawal-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #667eea; display: inline-block; width: 150px; }
        .amount { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
        .status-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📤 Withdrawal Submitted!</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>Your withdrawal request has been successfully submitted and is pending approval.</p>
          
          <div class="withdrawal-details">
            <h3 style="margin-top: 0;">💰 Withdrawal Details</h3>
            <div class="amount">KES ${withdrawal.amount.toLocaleString()}</div>
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span>${withdrawal.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Method:</span>
              <span>${withdrawal.withdrawalMethod === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}</span>
            </div>
            ${withdrawal.withdrawalMethod === 'MPESA' ? `
              <div class="detail-row">
                <span class="detail-label">M-Pesa Number:</span>
                <span>${withdrawal.mpesaPhoneNumber}</span>
              </div>
            ` : `
              <div class="detail-row">
                <span class="detail-label">Bank:</span>
                <span>${withdrawal.bankName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Account:</span>
                <span>${withdrawal.accountNumber}</span>
              </div>
            `}
            <div class="detail-row">
              <span class="detail-label">Submitted:</span>
              <span>${new Date().toLocaleString('en-KE', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi'
              })}</span>
            </div>
          </div>
          
          <div class="status-box">
            <h4 style="margin-top: 0;">⏳ What Happens Next?</h4>
            <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li>Our team will review your request within 24 hours</li>
              <li>You'll receive an email once approved</li>
              <li>${withdrawal.withdrawalMethod === 'MPESA' 
                ? 'M-Pesa withdrawals are processed within 24 hours after approval' 
                : 'Bank transfers typically take 1-3 business days after approval'}</li>
              <li>You can track the status in your wallet dashboard</li>
            </ul>
          </div>
          
          <p style="padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #0c5460;">
            <strong>💡 Note:</strong> You can cancel this request from your wallet page before it's approved.
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

export async function sendWithdrawalApprovedEmail(
  lawyerEmail: string,
  lawyerName: string,
  withdrawal: {
    id: string;
    amount: number;
    withdrawalMethod: string;
    mpesaPhoneNumber?: string | null;
    bankName?: string | null;
  }
): Promise<void> {
  const subject = '✅ Withdrawal Approved - Processing Payment';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .approved-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount { font-size: 36px; font-weight: bold; color: #28a745; margin: 10px 0; }
        .checkmark { font-size: 64px; color: #28a745; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Withdrawal Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>Great news! Your withdrawal request has been approved and is now being processed.</p>
          
          <div class="approved-box">
            <div class="checkmark">✓</div>
            <h2 style="margin: 10px 0; color: #28a745;">Approved Amount</h2>
            <div class="amount">KES ${withdrawal.amount.toLocaleString()}</div>
            <p style="margin: 10px 0;"><strong>Request ID:</strong> ${withdrawal.id}</p>
            <p style="margin: 10px 0;"><strong>Method:</strong> ${withdrawal.withdrawalMethod === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}</p>
            ${withdrawal.withdrawalMethod === 'MPESA' 
              ? `<p style="margin: 10px 0;"><strong>M-Pesa Number:</strong> ${withdrawal.mpesaPhoneNumber}</p>`
              : `<p style="margin: 10px 0;"><strong>Bank:</strong> ${withdrawal.bankName}</p>`
            }
          </div>
          
          <h3>📅 Payment Timeline</h3>
          <p style="padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            ${withdrawal.withdrawalMethod === 'MPESA' 
              ? 'Your M-Pesa payment will be sent within the next 24 hours. You will receive an M-Pesa confirmation message when the payment is completed.' 
              : 'Your bank transfer is being processed and should reflect in your account within 1-3 business days.'
            }
          </p>
          
          <p style="padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #0c5460; margin-top: 20px;">
            <strong>📧 Next Notification:</strong> You'll receive another email once the payment is completed.
          </p>
          
          <p style="text-align: center; margin-top: 30px; font-size: 18px; color: #28a745;">
            <strong>Thank you for using Wakili Pro! 🎉</strong>
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

export async function sendWithdrawalCompletedEmail(
  lawyerEmail: string,
  lawyerName: string,
  withdrawal: {
    id: string;
    amount: number;
    withdrawalMethod: string;
    transactionId?: string | null;
  }
): Promise<void> {
  const subject = '🎉 Withdrawal Completed - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount { font-size: 40px; font-weight: bold; color: #28a745; margin: 15px 0; }
        .checkmark { font-size: 72px; color: #28a745; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Payment Sent!</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <div class="success-box">
            <div class="checkmark">✓</div>
            <h2 style="margin: 10px 0; color: #28a745;">Withdrawal Completed Successfully!</h2>
            <div class="amount">KES ${withdrawal.amount.toLocaleString()}</div>
            <p style="margin: 10px 0;"><strong>Transaction ID:</strong> ${withdrawal.transactionId || 'N/A'}</p>
            <p style="margin: 10px 0;"><strong>Method:</strong> ${withdrawal.withdrawalMethod === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}</p>
          </div>
          
          <p style="font-size: 16px; padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #0c5460;">
            ${withdrawal.withdrawalMethod === 'MPESA' 
              ? '💬 The funds have been sent to your M-Pesa account. You should receive an M-Pesa confirmation message shortly.' 
              : '🏦 The funds have been transferred to your bank account. Please allow 1-3 business days for the transfer to reflect in your account.'
            }
          </p>
          
          <p style="padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <strong>📊 Transaction History:</strong> You can view your complete transaction history in your wallet dashboard.
          </p>
          
          <p style="text-align: center; margin-top: 30px; font-size: 18px;">
            <strong>Thank you for being a valued member of Wakili Pro! 🌟</strong>
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

export async function sendWithdrawalRejectedEmail(
  lawyerEmail: string,
  lawyerName: string,
  withdrawal: {
    id: string;
    amount: number;
    withdrawalMethod: string;
  },
  reason: string
): Promise<void> {
  const subject = '❌ Withdrawal Request Rejected - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .rejection-box { background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .reason-box { background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; border-radius: 5px; }
        .refund-info { background: #d1ecf1; border: 2px solid #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Withdrawal Rejected</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>We regret to inform you that your withdrawal request has been rejected.</p>
          
          <div class="rejection-box">
            <h3 style="margin-top: 0;">📋 Request Details</h3>
            <p><strong>Request ID:</strong> ${withdrawal.id}</p>
            <p><strong>Amount:</strong> KES ${withdrawal.amount.toLocaleString()}</p>
            <p><strong>Method:</strong> ${withdrawal.withdrawalMethod === 'MPESA' ? 'M-Pesa' : 'Bank Transfer'}</p>
          </div>
          
          <div class="reason-box">
            <h4 style="margin-top: 0;">📝 Rejection Reason:</h4>
            <p style="margin: 10px 0; font-size: 15px;">${reason}</p>
          </div>
          
          <div class="refund-info">
            <h4 style="margin-top: 0;">💰 Funds Status</h4>
            <p style="margin: 10px 0;">The requested amount of <strong style="font-size: 18px; color: #28a745;">KES ${withdrawal.amount.toLocaleString()}</strong> has been returned to your available balance and is ready for withdrawal.</p>
          </div>
          
          <p><strong>What You Can Do:</strong></p>
          <ul style="line-height: 1.8;">
            <li>Review the rejection reason above</li>
            <li>Contact our support team if you need clarification</li>
            <li>Submit a new withdrawal request after addressing the issue</li>
          </ul>
          
          <p style="padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <strong>📞 Need Help?</strong> Our support team is here to assist you. Please don't hesitate to reach out.
          </p>
          
          <p>We apologize for any inconvenience.</p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

// ========================================
// SESSION COMPLETION EMAILS
// ========================================

export async function sendPaymentReleasedEmail(
  lawyerEmail: string,
  lawyerName: string,
  booking: {
    id: string;
    consultationType: string;
    totalAmount: number;
    scheduledStartTime: Date;
  },
  clientName: string
): Promise<void> {
  const subject = '💰 Payment Released to Your Wallet - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .payment-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount { font-size: 40px; font-weight: bold; color: #28a745; margin: 15px 0; }
        .button { display: inline-block; background: #28a745; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payment Released!</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>Great news! The payment for your consultation with <strong>${clientName}</strong> has been released to your wallet.</p>
          
          <div class="payment-box">
            <h2 style="margin: 10px 0; color: #28a745;">💸 Earnings Added</h2>
            <div class="amount">KES ${booking.totalAmount.toLocaleString()}</div>
            <p style="margin: 10px 0;"><strong>Booking ID:</strong> ${booking.id}</p>
            <p style="margin: 10px 0;"><strong>Session Date:</strong> ${new Date(booking.scheduledStartTime).toLocaleString('en-KE', { 
              dateStyle: 'medium', 
              timeStyle: 'short',
              timeZone: 'Africa/Nairobi'
            })}</p>
          </div>
          
          <p style="font-size: 16px; padding: 15px; background: #d1ecf1; border-radius: 5px; border-left: 4px solid #0c5460;">
            <strong>💼 Available Now:</strong> This amount is now available in your wallet and ready for withdrawal.
          </p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/lawyer/wallet" class="button">View Wallet</a>
          </div>
          
          <p style="text-align: center; margin-top: 30px; font-size: 18px; color: #667eea;">
            <strong>Thank you for providing quality legal services! 🌟</strong>
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: lawyerEmail, subject, html });
}

// ========================================
// PASSWORD RESET EMAIL TEMPLATE
// ========================================

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'https://wakili-pro-1.onrender.com';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  const subject = '🔐 Password Reset Request - Wakili Pro';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .reset-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          
          <p>We received a request to reset your password for your Wakili Pro account.</p>
          
          <div class="reset-box">
            <p><strong>Click the button below to reset your password:</strong></p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div class="warning">
            <strong>⏰ Important:</strong> This link will expire in <strong>1 hour</strong> for security reasons.
          </div>
          
          <p style="padding: 15px; background: #e7f3ff; border-radius: 5px; border-left: 4px solid #2196f3;">
            <strong>🔒 Security Tips:</strong><br>
            • Never share your password with anyone<br>
            • Use a strong, unique password<br>
            • If you didn't request this reset, please ignore this email
          </p>
          
          <p style="margin-top: 30px; color: #666;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Security Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.<br>
          This is an automated email. Please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: userEmail, subject, html });
}
