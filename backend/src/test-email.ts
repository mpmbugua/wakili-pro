import 'dotenv/config';
import { sendEmail } from './services/emailService';

async function testEmail() {
  const recipient = process.argv[2] || process.env.EMAIL_USER;
  
  if (!recipient) {
    console.error('Usage: npm run test-email your-email@example.com');
    process.exit(1);
  }

  console.log('\n📧 Testing Email Configuration...\n');
  console.log('Sending test email to:', recipient);
  console.log('');

  try {
    await sendEmail({
      to: recipient,
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
            .badge { display: inline-block; padding: 5px 15px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
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
                <li>✅ Email delivery to ${recipient}</li>
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
    console.log('📬 Check the inbox of:', recipient);
    console.log('\n✅ Email notifications are working! You can now:');
    console.log('   1. Test document review notifications');
    console.log('   2. Test lawyer assignment notifications');
    console.log('   3. Test certification complete notifications\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. Wrong EMAIL_HOST (should be smtp.gmail.com for Gmail)');
    console.error('  2. Wrong EMAIL_PORT (use 587 for TLS, 465 for SSL)');
    console.error('  3. EMAIL_PASS should be App Password, not regular password');
    console.error('  4. Firewall blocking SMTP ports\n');
    process.exit(1);
  }
}

testEmail();
