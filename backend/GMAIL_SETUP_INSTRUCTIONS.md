# Gmail App Password Setup for Wakili Pro Email Notifications

## Step-by-Step Instructions

### 1. Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with your account: **mpmbugua.peter@gmail.com**
3. Scroll down to "Signing in to Google"
4. Click on **"2-Step Verification"**
5. Follow the prompts to enable 2-Step Verification
   - You'll need your phone number
   - Google will send you a verification code

### 2. Create App Password

1. After enabling 2-Step Verification, go back to Security settings
2. Find **"App passwords"** (under "Signing in to Google")
3. Click on **"App passwords"**
4. You may need to sign in again
5. In the "Select app" dropdown, choose **"Mail"**
6. In the "Select device" dropdown, choose **"Other (Custom name)"**
7. Type: **Wakili Pro**
8. Click **"Generate"**
9. Google will show you a 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Update .env File

1. Copy the 16-character app password (remove spaces)
2. Open `backend/.env`
3. Find the line: `EMAIL_PASS="YOUR_GMAIL_APP_PASSWORD_HERE"`
4. Replace `YOUR_GMAIL_APP_PASSWORD_HERE` with your app password
5. Example: `EMAIL_PASS="abcdefghijklmnop"`
6. Save the file

### 4. Test Email Configuration

Run the test script:

```bash
cd backend
node test-email.js mpmbugua.peter@gmail.com
```

You should see:
```
✅ SMTP connection verified!
📨 Sending test email...
✅ Test email sent successfully!
📬 Check the inbox of: mpmbugua.peter@gmail.com
```

### 5. Check Your Inbox

1. Check **mpmbugua.peter@gmail.com** inbox
2. Look for email with subject: "🧪 Wakili Pro - Email Test"
3. If you see it, email notifications are working! ✅

## Troubleshooting

### "Invalid credentials" error
- Make sure you copied the App Password correctly
- Remove all spaces from the App Password
- The password is 16 characters (lowercase letters only)

### "Username and Password not accepted"
- 2-Step Verification must be enabled first
- You must use App Password, not your regular Gmail password
- Wait 5-10 minutes after creating App Password for it to propagate

### Can't find "App passwords"
- 2-Step Verification must be enabled first
- Some Google Workspace accounts may have this disabled by admin
- Try accessing directly: https://myaccount.google.com/apppasswords

### Email not arriving
- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_FROM in .env are correct
- Make sure backend server has internet access
- Check firewall isn't blocking port 587

## Security Notes

⚠️ **Important:**
- Never commit the App Password to Git
- `.env` file is in `.gitignore` (safe)
- App Password is only for this application
- You can revoke it anytime in Google Account settings
- Create a new one if compromised

## Current Configuration

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=mpmbugua.peter@gmail.com
EMAIL_PASS=[YOUR_APP_PASSWORD]
EMAIL_FROM=Wakili Pro <mpmbugua.peter@gmail.com>
```

## What Emails Will Be Sent?

Once configured, Wakili Pro will automatically send:

1. **Document AI Review Complete** 
   - To: User who uploaded document
   - Content: AI analysis results with score

2. **Lawyer Assigned Notification**
   - SMS: User notification
   - Email: Lawyer notification with document details

3. **Certification Complete**
   - To: User who requested certification
   - Content: Download links for certified document and certificate

4. **Payment Confirmation**
   - To: User after successful M-Pesa payment
   - Content: Receipt and next steps

## Next Steps

After email is working:

1. ✅ Test with real document upload
2. ✅ Verify AI review email is received
3. ✅ Test lawyer assignment notification
4. ✅ Test certification complete email with downloads
5. 🎯 Switch to official wakilipro.com email when ready

---

**Need help?** Email notifications are in:
- `backend/src/services/documentNotificationService.ts`
- All email templates are there with HTML formatting
