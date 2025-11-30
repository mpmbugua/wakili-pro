const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Test Email Notification Script
 * 
 * This script helps you test email notifications without running the full app.
 * 
 * To use:
 * 1. Set up your email credentials in backend/.env:
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASS=your-app-password
 *    EMAIL_FROM=Wakili Pro <your-email@gmail.com>
 * 
 * 2. For Gmail, create an App Password:
 *    - Go to Google Account Settings → Security
 *    - Enable 2-Step Verification
 *    - Go to App Passwords
 *    - Create a new app password for "Mail"
 *    - Use that password in EMAIL_PASS
 * 
 * 3. Run this script:
 *    node backend/test-email.js your-test-email@example.com
 */

async function testEmail(recipientEmail) {
  console.log('\n📧 Testing Email Configuration...\n');
  console.log('Configuration:');
  console.log('  Host:', process.env.EMAIL_HOST);
  console.log('  Port:', process.env.EMAIL_PORT);
  console.log('  User:', process.env.EMAIL_USER);
  console.log('  From:', process.env.EMAIL_FROM);
  console.log('  Recipient:', recipientEmail);
  console.log('');

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Error: Email credentials not configured!');
    console.error('Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env');
    process.exit(1);
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientEmail,
      subject: '🧪 Wakili Pro - Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .badge { display: inline-block; padding: 5px 15px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Test Successful!</h1>
            </div>
            <div class="content">
              <p>Congratulations! Your Wakili Pro email notifications are working correctly.</p>
              
              <h3>What was tested:</h3>
              <ul>
                <li>✅ SMTP connection to ${process.env.EMAIL_HOST}</li>
                <li>✅ Authentication with ${process.env.EMAIL_USER}</li>
                <li>✅ Email delivery to ${recipientEmail}</li>
                <li>✅ HTML email rendering</li>
              </ul>

              <h3>Notification Types Available:</h3>
              <ul>
                <li><strong>AI Review Complete</strong> - Sent when document AI analysis finishes</li>
                <li><strong>Lawyer Assigned</strong> - SMS when a lawyer is assigned to review</li>
                <li><strong>Certification Complete</strong> - Email with download links for certified documents</li>
                <li><strong>Payment Success</strong> - Confirmation of M-Pesa payment</li>
              </ul>

              <p style="margin-top: 30px;">
                <span class="badge">Test Passed</span>
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you received this email, your notification system is ready to use!
              </p>
            </div>
            <div class="footer">
              <p>Wakili Pro - Legal Services Platform</p>
              <p>This is a test email sent at ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A');
    console.log('\n📬 Check the inbox of:', recipientEmail);
    console.log('\n✅ Email notifications are working! You can now:');
    console.log('   1. Test document review notifications');
    console.log('   2. Test lawyer assignment notifications');
    console.log('   3. Test certification complete notifications\n');

  } catch (error) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. Wrong EMAIL_HOST (should be smtp.gmail.com for Gmail)');
    console.error('  2. Wrong EMAIL_PORT (use 587 for TLS, 465 for SSL)');
    console.error('  3. EMAIL_PASS should be App Password, not regular password');
    console.error('  4. "Less secure app access" must be enabled for non-Gmail');
    console.error('  5. Firewall blocking SMTP ports\n');
    process.exit(1);
  }
}

// Get recipient from command line or use default
const recipient = process.argv[2] || process.env.EMAIL_USER;

if (!recipient) {
  console.error('Usage: node backend/test-email.js your-email@example.com');
  process.exit(1);
}

testEmail(recipient);
