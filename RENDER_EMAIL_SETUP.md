# Render Email Configuration Guide

## Issue
Password reset emails (and all transactional emails) are not being sent on Render because the email environment variables are not configured in production.

## Solution

### Step 1: Add Email Environment Variables on Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service
3. Click on "Environment" in the left sidebar
4. Add the following environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=mpmbugua.peter@gmail.com
EMAIL_PASS=cqkaxvntryotclpn
EMAIL_FROM=Wakili Pro <mpmbugua.peter@gmail.com>
```

### Step 2: Save and Redeploy

1. Click "Save Changes"
2. Render will automatically redeploy your service
3. Wait for deployment to complete

## How It Works

The email service (`backend/src/services/emailService.ts`) has three modes:

### Development Mode
```typescript
if (process.env.NODE_ENV === 'development') {
  // Logs email to console instead of sending
}
```

### Production Mode (SMTP Configured)
```typescript
// Creates Nodemailer transporter and sends via SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});
```

### Production Mode (SMTP Not Configured)
```typescript
if (!transporter) {
  console.warn('⚠️ Email not sent - SMTP not configured:', { to, subject });
  // Logs to console but doesn't throw error
}
```

## Verification

After configuring email variables on Render:

1. Test password reset flow:
   ```bash
   curl -X POST https://wakili-pro-api.onrender.com/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. Check Render logs:
   ```bash
   # Should see:
   [ForgotPassword] Attempting to send reset email to: test@example.com
   ✅ Email sent successfully: <message-id>
   ```

3. Check user's email inbox (including spam folder)

## Alternative Email Providers

### SendGrid (Recommended for Production)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxx
EMAIL_FROM=Wakili Pro <noreply@wakilipro.com>
```

### AWS SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=AKIAIOSFODNN7EXAMPLE
EMAIL_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EMAIL_FROM=Wakili Pro <noreply@wakilipro.com>
```

### Mailgun
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-smtp-password
EMAIL_FROM=Wakili Pro <noreply@wakilipro.com>
```

## Email Templates Using This Service

The following email templates will work once SMTP is configured:

1. **Password Reset** - `sendPasswordResetEmail()`
2. **Welcome Email** - `sendWelcomeEmail()`
3. **Booking Confirmation** - `sendBookingConfirmationEmail()`
4. **Payment Confirmation** - `sendPaymentConfirmationEmail()`
5. **Consultation Reminder** - `sendConsultationReminderEmail()`
6. **Withdrawal Notifications** - All withdrawal-related emails
7. **Session Completion** - `sendPaymentReleasedEmail()`

## Troubleshooting

### Email Not Sending
- **Check Render logs** for "[ForgotPassword]" or "Email" messages
- **Verify environment variables** are set correctly (no typos)
- **Test SMTP credentials** locally first

### Gmail App Password Issues
If using Gmail:
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password (no spaces)
4. Don't use your actual Gmail password

### Email Goes to Spam
- Use a verified domain (not @gmail.com)
- Set up SPF, DKIM, and DMARC records
- Use a transactional email service (SendGrid, AWS SES)

## Current Email Configuration

**Local (.env)**:
```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="mpmbugua.peter@gmail.com"
EMAIL_PASS="cqkaxvntryotclpn"
EMAIL_FROM="Wakili Pro <mpmbugua.peter@gmail.com>"
```

**Render (Production)**: ❌ NOT CONFIGURED - Add these variables!

## Security Notes

⚠️ **DO NOT** commit email credentials to Git
✅ **DO** use environment variables
✅ **DO** rotate app passwords regularly
✅ **DO** use transactional email services for production

## Next Steps After Email Configuration

1. ✅ Configure email variables on Render
2. ✅ Test password reset flow
3. ✅ Test other email notifications
4. 🔄 Consider migrating to SendGrid for better deliverability
5. 🔄 Set up email analytics/tracking
6. 🔄 Add email retry logic for failed sends
