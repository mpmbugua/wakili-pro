import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/emailService';

const prisma = new PrismaClient();

/**
 * Subscribe to newsletter
 */
export const subscribeToNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    console.log(`[Newsletter] New subscription: ${email}`);

    // Send welcome email
    const welcomeEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #1E40AF; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; }
          .content h2 { color: #1F2937; font-size: 20px; margin-top: 0; }
          .content p { color: #4B5563; margin: 15px 0; }
          .benefits { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits ul { margin: 10px 0; padding-left: 20px; }
          .benefits li { color: #374151; margin: 8px 0; }
          .cta-button { display: inline-block; background: #DBEAFE; color: #1E40AF; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #F9FAFB; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; border-top: none; }
          .footer p { color: #6B7280; font-size: 12px; margin: 5px 0; }
          .footer a { color: #1E40AF; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Wakili Pro!</h1>
          </div>
          <div class="content">
            <h2>Thank you for subscribing to our newsletter!</h2>
            <p>Hi there,</p>
            <p>We're thrilled to have you join our community of legal enthusiasts and professionals. You've just taken the first step towards staying informed about Kenya's legal landscape.</p>
            
            <div class="benefits">
              <h3 style="color: #1F2937; margin-top: 0;">What you'll receive:</h3>
              <ul>
                <li><strong>Weekly Legal Updates</strong> - Latest changes in Kenyan law and regulations</li>
                <li><strong>Expert Commentary</strong> - Insights from verified lawyers and legal professionals</li>
                <li><strong>Legal Guides</strong> - Step-by-step guides on common legal procedures</li>
                <li><strong>Case Studies</strong> - Real-world examples and precedents</li>
                <li><strong>Exclusive Resources</strong> - Access to premium legal templates and tools</li>
              </ul>
            </div>

            <p>While you're here, explore what Wakili Pro has to offer:</p>
            <p style="text-align: center;">
              <a href="https://wakilipro.com" class="cta-button">Explore Wakili Pro</a>
            </p>

            <p>Have questions or need legal assistance? Our platform connects you with verified lawyers across Kenya, provides AI-powered legal guidance, and offers a marketplace of legal documents.</p>
            
            <p style="margin-top: 30px;">Stay informed, stay protected!</p>
            <p><strong>The Wakili Pro Team</strong></p>
          </div>
          <div class="footer">
            <p>Wakili Pro - Your Trusted Legal Platform in Kenya</p>
            <p>
              <a href="https://wakilipro.com/privacy">Privacy Policy</a> | 
              <a href="https://wakilipro.com/terms">Terms of Service</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">
              You received this email because you subscribed to Wakili Pro newsletter.<br>
              Not interested anymore? You can <a href="https://wakilipro.com">unsubscribe</a> at any time.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send welcome email asynchronously (non-blocking)
    sendEmail({
      to: email,
      subject: '🎉 Welcome to Wakili Pro Newsletter!',
      html: welcomeEmailHtml
    }).catch(err => {
      console.error('[Newsletter] Failed to send welcome email:', err);
      // Don't throw - subscription already successful
    });

    // TODO: In production, save to database:
    // await prisma.newsletter.create({
    //   data: { email, subscribedAt: new Date() }
    // });

    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    });

  } catch (error) {
    console.error('[Newsletter] Subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
};

/**
 * Unsubscribe from newsletter
 */
export const unsubscribeFromNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`[Newsletter] Unsubscribe request: ${email}`);

    // TODO: In production, remove from database:
    // await prisma.newsletter.delete({
    //   where: { email }
    // });

    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('[Newsletter] Unsubscribe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again later.'
    });
  }
};
