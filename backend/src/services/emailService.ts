/**
 * Email Service for Wakili Pro
 * 
 * This service handles sending emails using Nodemailer with SMTP configuration.
 * Supports Gmail, SendGrid, AWS SES, and any SMTP-compatible email service.
 * 
 * Environment Variables Required:
 * - EMAIL_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP server port (587 for TLS, 465 for SSL)
 * - EMAIL_USER: SMTP username/email
 * - EMAIL_PASS: SMTP password/app password
 * - EMAIL_FROM: Default from address
 */

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

// Create reusable transporter
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Validate configuration
  if (!config.host || !config.auth.user || !config.auth.pass) {
    console.warn('Email configuration incomplete. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport(config);
};

let transporter: nodemailer.Transporter | null = null;

/**
 * Core email sending function
 * @param options Email configuration options
 * @returns Promise<void>
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, from, replyTo, cc, bcc } = options;
  
  const fromAddress = from || process.env.EMAIL_FROM || 'noreply@wakilipro.com';
  
  // Development mode: log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== 📧 Email Sent (Development Mode) ===');
    console.log('From:', fromAddress);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Preview:', html.substring(0, 200) + '...');
    console.log('=======================================\n');
    return;
  }

  // Production mode: send via SMTP
  try {
    // Create transporter if not already created
    if (!transporter) {
      transporter = createTransporter();
    }

    // If transporter creation failed, fall back to console logging
    if (!transporter) {
      console.warn('⚠️ Email not sent - SMTP not configured:', { to, subject });
      console.log('Email content:', html.substring(0, 300) + '...');
      return;
    }

    // Send email
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      replyTo,
      cc,
      bcc,
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Email details:', { to, subject, from: fromAddress });
    // Don't throw - we don't want email failures to break the application
    // Consider adding error logging/monitoring here
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
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
        .button { display: inline-block; background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Wakili Pro!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>Welcome to <strong>Wakili Pro</strong> - your gateway to professional legal services in Kenya!</p>
          
          <p>Your account has been successfully created. Here's what you can do now:</p>
          
          <ul style="line-height: 1.8;">
            <li>Browse qualified lawyers by specialization</li>
            <li>Book video, phone, or in-person consultations</li>
            <li>Securely manage your bookings and payments</li>
            <li>Get professional legal advice when you need it</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <p>If you have any questions, our support team is here to help.</p>
          
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
    to: email,
    subject: 'Welcome to Wakili Pro! 🎉',
    html
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
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
        .button { display: inline-block; background: #f5576c; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          
          <p>You requested to reset your password for your Wakili Pro account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="alert">
            <strong>⏰ Important:</strong> This link expires in 1 hour for security reasons.
          </div>
          
          <p><strong>If you didn't request this:</strong> Please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security, never share this link with anyone.</p>
          
          <p>Best regards,<br><strong>Wakili Pro Security Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Wakili Pro. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Wakili Pro',
    html
  });
}
