import prisma from '../lib/prisma';
import { sendEmail } from './emailService';
import { sendSMS } from './smsService';

/**
 * Notification service for lawyer matching system
 * Handles email and SMS notifications when lawyers are matched to service requests
 */

interface MatchedLawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  specializations: string[];
}

interface ServiceRequestNotification {
  id: string;
  serviceCategory: string;
  serviceTitle: string;
  description: string;
  estimatedFee: number;
  tier: string;
  urgency: string;
  createdAt: Date;
  phoneNumber?: string;
  email?: string;
}

/**
 * Notify matched lawyers about a new service request
 * Sends both email and SMS to increase response rate
 */
export async function notifyMatchedLawyers(
  serviceRequest: ServiceRequestNotification,
  matchedLawyers: MatchedLawyer[]
): Promise<void> {
  const connectionFee = serviceRequest.tier === 'tier2' ? 5000 : 2000;
  const tierLabel = serviceRequest.tier === 'tier2' ? 'Premium (PRO only)' : 'Standard';
  const urgencyLabel = serviceRequest.urgency === 'urgent' ? '🚨 URGENT' : '';

  // Send notifications to all matched lawyers in parallel
  const notifications = matchedLawyers.map(async (lawyer) => {
    try {
      // Email notification
      const emailSubject = `${urgencyLabel} New Service Request: ${serviceRequest.serviceCategory}`;
      const emailBody = generateEmailTemplate(serviceRequest, lawyer, connectionFee, tierLabel);
      
      await sendEmail({
        to: lawyer.email,
        subject: emailSubject,
        html: emailBody
      });

      // SMS notification
      const smsMessage = generateSMSTemplate(serviceRequest, lawyer, connectionFee);
      await sendSMS(lawyer.phone, smsMessage);

      console.log(`✅ Notifications sent to lawyer ${lawyer.name} (${lawyer.email})`);
    } catch (error) {
      console.error(`❌ Failed to notify lawyer ${lawyer.name}:`, error);
      // Don't throw - continue notifying other lawyers even if one fails
    }
  });

  await Promise.all(notifications);
}

/**
 * Generate HTML email template for lawyer notification
 */
function generateEmailTemplate(
  serviceRequest: ServiceRequestNotification,
  lawyer: MatchedLawyer,
  connectionFee: number,
  tierLabel: string
): string {
  const urgencyBadge = serviceRequest.urgency === 'urgent' 
    ? '<span style="background: #EF4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">URGENT</span>'
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F2937; background: #F9FAFB; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Wakili Pro</h1>
      <p style="color: #BFDBFE; margin: 8px 0 0 0; font-size: 14px;">New Service Request Matched</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Greeting -->
      <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
        Hello <strong>${lawyer.name}</strong>,
      </p>

      <p style="font-size: 15px; color: #4B5563; margin: 0 0 24px 0;">
        Great news! You've been matched to a new service request that matches your expertise. ${serviceRequest.urgency === 'urgent' ? 'The client marked this as <strong>URGENT</strong> and needs immediate assistance.' : 'Review the details below and submit your quote to win this opportunity.'}
      </p>

      <!-- Service Request Card -->
      <div style="background: #F3F4F6; border-left: 4px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        
        <div style="margin-bottom: 16px;">
          ${urgencyBadge}
        </div>

        <h2 style="color: #1F2937; font-size: 18px; margin: 0 0 12px 0; font-weight: 600;">
          ${serviceRequest.serviceTitle}
        </h2>

        <div style="margin: 16px 0;">
          <p style="margin: 6px 0; font-size: 14px; color: #6B7280;">
            <strong>Category:</strong> ${serviceRequest.serviceCategory}
          </p>
          <p style="margin: 6px 0; font-size: 14px; color: #6B7280;">
            <strong>Service Tier:</strong> ${tierLabel}
          </p>
          <p style="margin: 6px 0; font-size: 14px; color: #6B7280;">
            <strong>Estimated Legal Fees:</strong> <span style="color: #059669; font-weight: 600;">KES ${serviceRequest.estimatedFee.toLocaleString()}</span>
          </p>
          <p style="margin: 6px 0; font-size: 14px; color: #6B7280;">
            <strong>Posted:</strong> ${new Date(serviceRequest.createdAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>

        <div style="background: white; border-radius: 6px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151;">Description:</p>
          <p style="margin: 0; font-size: 14px; color: #6B7280; line-height: 1.6;">
            ${serviceRequest.description}
          </p>
        </div>
      </div>

      <!-- Connection Fee Info -->
      <div style="background: #FEF3C7; border: 1px solid #FDE047; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400E;">
          💼 Connection Fee Required
        </p>
        <p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.6;">
          To access client contact details and submit your quote, pay a one-time connection fee of <strong>KES ${connectionFee.toLocaleString()}</strong>. This fee covers platform matching and support services.
        </p>
      </div>

      <!-- How It Works -->
      <div style="background: #DBEAFE; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1E40AF;">
          📋 Next Steps:
        </p>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #1E3A8A; line-height: 1.8;">
          <li>Pay connection fee (KES ${connectionFee.toLocaleString()}) via M-Pesa or card</li>
          <li>Access full client contact details</li>
          <li>Submit your quote with proposed fee, timeline, and approach</li>
          <li>Client reviews up to 3 quotes and selects the best lawyer</li>
          <li>If selected, you keep 100% of your quoted service fee</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${process.env.FRONTEND_URL}/service-requests/${serviceRequest.id}/quote" 
           style="display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
          Submit Your Quote
        </a>
      </div>

      <p style="font-size: 13px; color: #9CA3AF; text-align: center; margin: 20px 0 0 0;">
        Click the button above to view full details and submit your quote
      </p>

    </div>

    <!-- Footer -->
    <div style="background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 20px; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280;">
        Need help? Contact our support team at <a href="mailto:support@wakilipro.com" style="color: #3B82F6; text-decoration: none;">support@wakilipro.com</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
        © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate SMS template for lawyer notification
 * Kept short to fit within SMS character limits
 */
function generateSMSTemplate(
  serviceRequest: ServiceRequestNotification,
  lawyer: MatchedLawyer,
  connectionFee: number
): string {
  const urgencyTag = serviceRequest.urgency === 'urgent' ? '[URGENT] ' : '';
  
  return `${urgencyTag}Wakili Pro: New ${serviceRequest.serviceCategory} request matched! Est. fee: KES ${serviceRequest.estimatedFee.toLocaleString()}. Connection fee: KES ${connectionFee.toLocaleString()}. Submit quote: ${process.env.FRONTEND_URL}/service-requests/${serviceRequest.id}/quote`;
}

/**
 * Notify client when quotes are received
 */
export async function notifyClientQuotesReceived(
  serviceRequestId: string,
  quoteCount: number
): Promise<void> {
  try {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { user: true }
    });

    if (!serviceRequest) {
      console.error(`Service request ${serviceRequestId} not found`);
      return;
    }

    const emailSubject = `${quoteCount} lawyer${quoteCount > 1 ? 's' : ''} quoted on your request`;
    const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1E3A8A;">Great News! Quotes Received</h2>
    
    <p>Hello ${serviceRequest.user.name},</p>
    
    <p>You've received <strong>${quoteCount} quote${quoteCount > 1 ? 's' : ''}</strong> from qualified lawyers for your <strong>${serviceRequest.serviceCategory}</strong> request.</p>
    
    <p>Review and compare quotes to find the best lawyer for your needs.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/service-requests/${serviceRequest.id}/quotes" 
         style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
        Compare Quotes
      </a>
    </div>
    
    <p style="color: #666; font-size: 13px;">
      Need help choosing? Our support team is here to assist you.
    </p>
  </div>
</body>
</html>
    `.trim();

    await sendEmail({
      to: serviceRequest.user.email,
      subject: emailSubject,
      html: emailBody
    });

    // Send SMS notification
    const smsMessage = `Wakili Pro: ${quoteCount} lawyer${quoteCount > 1 ? 's' : ''} quoted on your ${serviceRequest.serviceCategory} request. Compare quotes: ${process.env.FRONTEND_URL}/service-requests/${serviceRequest.id}/quotes`;
    
    if (serviceRequest.phoneNumber) {
      await sendSMS(serviceRequest.phoneNumber, smsMessage);
    }

    console.log(`✅ Quote notification sent to client ${serviceRequest.user.email}`);
  } catch (error) {
    console.error('Failed to notify client about quotes:', error);
  }
}

/**
 * Notify selected lawyer that client chose their quote
 */
export async function notifyLawyerSelected(
  quoteId: string
): Promise<void> {
  try {
    const quote = await prisma.lawyerQuote.findUnique({
      where: { id: quoteId },
      include: {
        lawyer: true,
        serviceRequest: {
          include: { user: true }
        }
      }
    });

    if (!quote) {
      console.error(`Quote ${quoteId} not found`);
      return;
    }

    const emailSubject = `🎉 Congratulations! Client selected your quote`;
    const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">Congratulations ${quote.lawyer.name}!</h2>
    
    <p>Great news! The client has selected your quote for their <strong>${quote.serviceRequest.serviceCategory}</strong> request.</p>
    
    <div style="background: #F0FDF4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #065F46;">Client Contact Information</h3>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${quote.serviceRequest.user.name}</p>
      <p style="margin: 4px 0;"><strong>Email:</strong> ${quote.serviceRequest.email || quote.serviceRequest.user.email}</p>
      <p style="margin: 4px 0;"><strong>Phone:</strong> ${quote.serviceRequest.phoneNumber || quote.serviceRequest.user.phoneNumber}</p>
    </div>
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; color: #92400E;">Your Quote Details</h3>
      <p style="margin: 4px 0;"><strong>Proposed Fee:</strong> KES ${quote.proposedFee.toLocaleString()}</p>
      <p style="margin: 4px 0;"><strong>Timeline:</strong> ${quote.proposedTimeline}</p>
    </div>
    
    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Contact the client directly to confirm details</li>
      <li>Agree on payment terms and milestones</li>
      <li>Begin work as per your proposed timeline</li>
      <li>Mark service as complete when finished</li>
    </ol>
    
    <p style="color: #666; font-size: 13px; margin-top: 30px;">
      Remember: Payment happens directly between you and the client. Wakili Pro is not involved in the service payment.
    </p>
  </div>
</body>
</html>
    `.trim();

    await sendEmail({
      to: quote.lawyer.email,
      subject: emailSubject,
      html: emailBody
    });

    // Send SMS
    const smsMessage = `Wakili Pro: Congratulations! Client selected your quote for ${quote.serviceRequest.serviceCategory}. Client: ${quote.serviceRequest.user.name}, Phone: ${quote.serviceRequest.phoneNumber}`;
    
    if (quote.lawyer.phoneNumber) {
      await sendSMS(quote.lawyer.phoneNumber, smsMessage);
    }

    console.log(`✅ Selection notification sent to lawyer ${quote.lawyer.email}`);
  } catch (error) {
    console.error('Failed to notify selected lawyer:', error);
  }
}
