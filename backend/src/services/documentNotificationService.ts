/**
 * Document Review Notification Service
 * Handles email and SMS notifications for document review lifecycle
 */

import { sendEmail } from './emailService';
import { sendSMS } from './smsService';

/**
 * Send email when AI review is completed
 */
export async function sendAIReviewCompleteEmail(
  userEmail: string,
  userName: string,
  documentTitle: string,
  reviewId: string,
  overallScore: number
): Promise<void> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/document-reviews`;
  
  const scoreColor = overallScore >= 90 ? '#10b981' : overallScore >= 75 ? '#3b82f6' : overallScore >= 50 ? '#eab308' : '#ef4444';
  const scoreStatus = overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' : overallScore >= 50 ? 'Needs Improvement' : 'Critical Issues';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .score-badge { display: inline-block; background: ${scoreColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ AI Review Complete!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>Great news! The AI analysis of your document <strong>"${documentTitle}"</strong> is now complete.</p>
          
          <div style="text-align: center;">
            <div class="score-badge">Score: ${overallScore}% - ${scoreStatus}</div>
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📊 What's been analyzed:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Document completeness and missing fields</li>
              <li>Internal consistency and accuracy</li>
              <li>Legal compliance with Kenyan law</li>
              <li>Formatting and structure</li>
            </ul>
          </div>
          
          <p>You can now view:</p>
          <ul>
            <li>Detailed AI analysis and recommendations</li>
            <li>Identified issues and missing information</li>
            <li>Legal compliance assessment</li>
            <li>Suggestions for improvement</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View Detailed Results</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Next Steps:</strong><br>
            ${overallScore >= 75 
              ? 'Your document is in good shape! If you selected certification, a lawyer will be assigned shortly.'
              : 'Review the AI recommendations and consider updating your document before lawyer certification.'
            }
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.<br>
          Need help? Contact us at support@wakilipro.com
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `✅ AI Review Complete - ${documentTitle} (Score: ${overallScore}%)`,
    html
  });
}

/**
 * Send SMS when lawyer is assigned to document review
 */
export async function sendLawyerAssignedSMS(
  userPhone: string,
  userName: string,
  lawyerName: string,
  documentTitle: string
): Promise<void> {
  const message = `Wakili Pro: Good news ${userName}! Lawyer ${lawyerName} has been assigned to review "${documentTitle}". You'll receive updates as the review progresses.`;
  
  await sendSMS(userPhone, message);
}

/**
 * Send email when lawyer is assigned (detailed version)
 */
export async function sendLawyerAssignedEmail(
  userEmail: string,
  userName: string,
  lawyerName: string,
  documentTitle: string,
  estimatedDelivery: Date
): Promise<void> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/document-reviews`;
  const formattedDate = estimatedDelivery.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .lawyer-card { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .lawyer-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 10px 0; }
        .button { display: inline-block; background: #8b5cf6; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👨‍⚖️ Lawyer Assigned!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>Excellent news! A certified lawyer has been assigned to review and certify your document <strong>"${documentTitle}"</strong>.</p>
          
          <div class="lawyer-card">
            <div style="font-size: 48px; margin-bottom: 10px;">👨‍⚖️</div>
            <div class="lawyer-name">${lawyerName}</div>
            <div style="color: #6b7280; font-size: 14px;">Certified Legal Professional</div>
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>⏰ Estimated Delivery:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 16px;">${formattedDate}</p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ol>
            <li>The lawyer will thoroughly review your document</li>
            <li>They'll verify legal compliance and accuracy</li>
            <li>Your document will be certified with an official signature and stamp</li>
            <li>You'll receive the certified document with a Certificate of Authenticity</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Track Review Progress</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You'll receive another notification when the certification is complete and your document is ready for download.
          </p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.<br>
          Need help? Contact us at support@wakilipro.com
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `👨‍⚖️ Lawyer Assigned - ${lawyerName} will review "${documentTitle}"`,
    html
  });
}

/**
 * Send email when document certification is complete with download links
 */
export async function sendCertificationCompleteEmail(
  userEmail: string,
  userName: string,
  documentTitle: string,
  certificateId: string,
  certifiedDocumentUrl: string,
  certificateUrl: string,
  lawyerName: string
): Promise<void> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/document-reviews`;
  const verifyUrl = `${process.env.FRONTEND_URL}/verify/${certificateId}`;
  const downloadDocUrl = `${process.env.BACKEND_URL}${certifiedDocumentUrl}`;
  const downloadCertUrl = `${process.env.BACKEND_URL}${certificateUrl}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .success-badge { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .success-badge h2 { margin: 0; font-size: 22px; }
        .certificate-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .certificate-id { font-family: monospace; font-size: 20px; font-weight: bold; color: #047857; background: white; padding: 10px; border-radius: 4px; margin: 10px 0; display: inline-block; }
        .download-section { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .download-button { display: block; background: #10b981; color: white !important; padding: 14px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 600; text-align: center; }
        .verify-button { display: inline-block; background: #3b82f6; color: white !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Certification Complete!</h1>
        </div>
        <div class="content">
          <p>Dear ${userName},</p>
          
          <div class="success-badge">
            <h2>✓ Your document has been certified!</h2>
          </div>
          
          <p>Great news! <strong>${lawyerName}</strong> has successfully certified your document <strong>"${documentTitle}"</strong>.</p>
          
          <div class="certificate-box">
            <div style="font-size: 48px; margin-bottom: 10px;">📜</div>
            <p style="margin: 10px 0 5px 0;"><strong>Certificate ID:</strong></p>
            <div class="certificate-id">${certificateId}</div>
            <p style="margin: 15px 0 5px 0; font-size: 14px; color: #6b7280;">This unique ID can be used to verify the authenticity of your certified document</p>
          </div>
          
          <div class="download-section">
            <p style="margin-top: 0;"><strong>📥 Download Your Documents:</strong></p>
            
            <a href="${downloadDocUrl}" class="download-button">
              📄 Download Certified Document
            </a>
            
            <a href="${downloadCertUrl}" class="download-button">
              🏆 Download Certificate of Authenticity
            </a>
          </div>
          
          <p><strong>What's included:</strong></p>
          <ul>
            <li>✅ Original document with lawyer's digital signature</li>
            <li>✅ Official stamp and firm letterhead</li>
            <li>✅ Certificate of Authenticity with QR code</li>
            <li>✅ Verification details for third-party validation</li>
          </ul>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>🔍 Verify Authenticity:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Anyone can verify your certified document using the Certificate ID above or by scanning the QR code on the certificate.</p>
            <div style="text-align: center; margin-top: 15px;">
              <a href="${verifyUrl}" class="verify-button">Verify Certificate</a>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">View All Your Documents →</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Need another document certified?</strong> Simply upload it and we'll get it reviewed and certified quickly!
          </p>
          
          <p>Thank you for trusting Wakili Pro!</p>
          
          <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.<br>
          Need help? Contact us at support@wakilipro.com
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject: `🎉 Certificate Ready! "${documentTitle}" - ID: ${certificateId}`,
    html
  });
}

/**
 * Send SMS when certification is complete
 */
export async function sendCertificationCompleteSMS(
  userPhone: string,
  userName: string,
  documentTitle: string,
  certificateId: string
): Promise<void> {
  const dashboardUrl = `${process.env.FRONTEND_URL}/document-reviews`;
  const message = `Wakili Pro: Great news ${userName}! Your document "${documentTitle}" is certified! Certificate ID: ${certificateId}. Download now: ${dashboardUrl}`;
  
  await sendSMS(userPhone, message);
}

/**
 * Notify lawyer when assigned to a document review
 */
export async function notifyLawyerOfAssignment(
  lawyerEmail: string,
  lawyerPhone: string,
  lawyerName: string,
  documentTitle: string,
  reviewId: string,
  urgency: string,
  deadline: Date
): Promise<void> {
  const reviewUrl = `${process.env.FRONTEND_URL}/lawyer/certifications`;
  const formattedDeadline = deadline.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Email to lawyer
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .urgency-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .urgency-STANDARD { background: #dbeafe; color: #1e40af; }
        .urgency-EXPRESS { background: #fef3c7; color: #92400e; }
        .urgency-ECONOMY { background: #d1fae5; color: #065f46; }
        .button { display: inline-block; background: #6366f1; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Document Assignment</h1>
        </div>
        <div class="content">
          <p>Dear ${lawyerName},</p>
          
          <p>A new document has been assigned to you for review and certification.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📄 Document:</strong> ${documentTitle}</p>
            <p style="margin: 10px 0 0 0;">
              <strong>Priority:</strong> 
              <span class="urgency-badge urgency-${urgency}">${urgency}</span>
            </p>
            <p style="margin: 10px 0 0 0;"><strong>⏰ Deadline:</strong> ${formattedDeadline}</p>
          </div>
          
          <p><strong>Your tasks:</strong></p>
          <ol>
            <li>Review the document for legal compliance and accuracy</li>
            <li>Apply your digital signature and stamp</li>
            <li>Generate the Certificate of Authenticity</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${reviewUrl}" class="button">Review Document Now</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Please complete this review before the deadline to maintain high client satisfaction.
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

  await sendEmail({
    to: lawyerEmail,
    subject: `📋 New Document Assignment - "${documentTitle}" (${urgency})`,
    html
  });

  // SMS to lawyer
  const smsMessage = `Wakili Pro: New ${urgency} document assigned - "${documentTitle}". Deadline: ${formattedDeadline}. Review: ${reviewUrl}`;
  await sendSMS(lawyerPhone, smsMessage);
}
