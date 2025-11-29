# Flutterwave Setup Guide - Quick Start

## 🔗 Get Your Flutterwave Credentials

### Step 1: Create Flutterwave Account
**Sign up here:** https://dashboard.flutterwave.com/signup

- Use your business email
- Select **Kenya** as your country
- Business type: **Freelancer/Startup** (or appropriate type)

### Step 2: Access API Keys Dashboard
**Direct link:** https://dashboard.flutterwave.com/dashboard/settings/apis

Or navigate: Dashboard → Settings → API Keys

### Step 3: Get Your Credentials

You'll see two environments:

#### 🧪 Test Mode (for development)
```
Public Key:  FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key:  FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 🚀 Live Mode (for production - requires KYC verification)
```
Public Key:  FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret Key:  FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Start with TEST MODE credentials!**

### Step 4: Generate Webhook Hash
1. Scroll down to **Webhooks** section
2. Create a unique secret hash (e.g., `wakili_flw_secret_2024`)
3. Save it - you'll use this for `FLUTTERWAVE_SECRET_HASH`

### Step 5: Configure Webhook URL
**Webhook URL:** `https://your-backend-url.com/api/document-payment/flutterwave-webhook`

For local testing:
- Use **ngrok**: `ngrok http 5000`
- Get URL: `https://xxxxx.ngrok.io`
- Set webhook: `https://xxxxx.ngrok.io/api/document-payment/flutterwave-webhook`

---

## 📝 Update Your .env File

Open `backend/.env` and update these values:

```env
# Replace with your actual credentials from Flutterwave dashboard
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-your_actual_public_key_here"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-your_actual_secret_key_here"
FLUTTERWAVE_SECRET_HASH="your_webhook_secret_hash_here"
FLUTTERWAVE_BASE_URL="https://api.flutterwave.com/v3"
FLUTTERWAVE_REDIRECT_URL="http://localhost:3000/payment-callback"
```

---

## ✅ Test Payment Cards

Flutterwave provides test cards for sandbox testing:

### Successful Payment
```
Card Number:  5531 8866 5214 2950
CVV:          564
Expiry:       09/32
PIN:          3310
OTP:          12345
```

### Mastercard
```
Card Number:  5438 8980 1456 0229
CVV:          564
Expiry:       10/31
PIN:          3310
OTP:          12345
```

### Visa Card
```
Card Number:  4187 4274 1556 4246
CVV:          828
Expiry:       09/32
PIN:          3310
OTP:          12345
```

### Failed Payment (for testing error handling)
```
Card Number:  5143 0100 0000 0000
CVV:          276
Expiry:       01/99
```

**Full test card list:** https://developer.flutterwave.com/docs/integration-guides/testing-helpers

---

## 🧪 Test the Integration

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Payment Flow
1. Upload a document at http://localhost:3000/documents
2. Click "Request Review"
3. Select service tier and urgency
4. Choose **Card Payment** (Flutterwave)
5. You'll be redirected to Flutterwave checkout
6. Use test card: `5531 8866 5214 2950`
7. Complete payment
8. Should redirect back to `/payment-callback`
9. Verify payment success

---

## 🔍 Verify Webhook Delivery

### Option 1: Flutterwave Dashboard
1. Go to: https://dashboard.flutterwave.com/dashboard/settings/webhooks
2. Click "Webhook Logs"
3. Check delivery status

### Option 2: Backend Logs
```bash
# Watch backend console for webhook events
[WEBHOOK] Received Flutterwave webhook
[WEBHOOK] Event: charge.completed
[WEBHOOK] Transaction verified: FLW-MOCK-xxxxxx
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid Public Key"
**Solution:** Double-check you copied the FULL key including `FLWPUBK_TEST-` prefix

### Issue 2: Webhook Not Received
**Solutions:**
- Verify webhook URL is publicly accessible (use ngrok for local)
- Check webhook hash matches exactly
- Review Flutterwave webhook logs for delivery errors

### Issue 3: Payment Success but Not Updating
**Solutions:**
- Check webhook signature verification in backend
- Ensure `FLUTTERWAVE_SECRET_HASH` is correct
- Review backend error logs

### Issue 4: "Transaction Verification Failed"
**Solutions:**
- Confirm `FLUTTERWAVE_SECRET_KEY` is correct
- Check API base URL is `https://api.flutterwave.com/v3`
- Test with fresh credentials

---

## 📊 Current Configuration Status

### ✅ Already Configured
- M-Pesa (Sandbox): Ready to use
- Database: PostgreSQL on Render
- Cloudinary: File storage ready
- Frontend: Payment callback route configured

### ⏳ Needs Configuration
- Flutterwave API keys (follow steps above)
- Webhook URL (after deploying backend or using ngrok)

---

## 🔄 Moving to Production

When ready for live payments:

1. **Complete KYC Verification**
   - Submit business documents
   - Wait for Flutterwave approval (1-3 days)

2. **Switch to Live Keys**
   ```env
   FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-xxxxx"  # No "TEST-" prefix
   FLUTTERWAVE_SECRET_KEY="FLWSECK-xxxxx"  # No "TEST-" prefix
   ```

3. **Update Webhook URL**
   ```env
   FLUTTERWAVE_REDIRECT_URL="https://yourdomain.com/payment-callback"
   ```

4. **Set Live Webhook**
   - Dashboard → Settings → Webhooks
   - Add: `https://yourbackend.com/api/document-payment/flutterwave-webhook`

5. **Test with Real Card**
   - Use your own card for small test transaction
   - Verify end-to-end flow works

---

## 📞 Support Resources

- **Flutterwave Docs:** https://developer.flutterwave.com/docs
- **API Reference:** https://developer.flutterwave.com/reference
- **Support Email:** developers@flutterwavego.com
- **Slack Community:** https://join.slack.com/t/flutterwavedevelopers

---

## 🎯 Quick Checklist

Before testing, ensure:
- [ ] Flutterwave account created
- [ ] Test mode API keys copied to `.env`
- [ ] Webhook hash generated and added to `.env`
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Test card numbers ready
- [ ] Browser network tab open (to debug if needed)

---

**Last Updated:** November 29, 2025  
**Status:** Ready for credential configuration  
**Next Step:** Create Flutterwave account and get API keys
