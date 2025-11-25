/**
 * Email service for sending transactional emails
 * Uses SendGrid/AWS SES/Resend in production
 * Logs to console in development
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email
 * In production, this should use SendGrid, AWS SES, or similar service
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = options.from || process.env.EMAIL_FROM || 'noreply@wakilipro.com';

  // In development, just log the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
    console.log('━'.repeat(80));
    console.log(`From: ${from}`);
    console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`HTML Length: ${options.html.length} characters`);
    console.log('━'.repeat(80));
    console.log('\n');
    return;
  }

  // TODO: Production implementation
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: options.to,
    from: from,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
  });
  */

  // Example with Resend:
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  */

  console.warn('⚠️ Email service not configured for production. Email would be sent:', {
    to: options.to,
    subject: options.subject
  });
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const html = `
    <h1>Welcome to Wakili Pro, ${name}!</h1>
    <p>Your account has been created successfully.</p>
    <p>Start exploring our platform to connect with qualified lawyers.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Wakili Pro',
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
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Click the link below to proceed:</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Wakili Pro',
    html
  });
}
