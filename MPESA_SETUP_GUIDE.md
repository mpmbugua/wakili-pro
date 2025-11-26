# M-Pesa Daraja API Integration - Setup Guide

## Overview
Wakili Pro now has **production-ready M-Pesa integration** using Safaricom's Daraja API (STK Push/Lipa Na M-Pesa Online).

---

## Quick Start (Test Mode)

### 1. Get Sandbox Credentials (Free)

Visit: **https://developer.safaricom.co.ke/**

1. Click **"Sign Up"** / **"Log In"**
2. Create account with your email
3. Go to **"My Apps"** → **"Create New App"**
4. Select **"Lipa Na M-Pesa Sandbox"** product
5. Get your credentials from the app dashboard

### 2. Configure Environment Variables

Add to `backend/.env`:

```env
# M-Pesa Daraja API (Sandbox - for testing)
MPESA_CONSUMER_KEY="your-consumer-key-from-dashboard"
MPESA_CONSUMER_SECRET="your-consumer-secret-from-dashboard"
MPESA_SHORTCODE="174379"
MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
MPESA_ENVIRONMENT="sandbox"

# Callback URLs (use ngrok for local testing)
MPESA_CALLBACK_URL="https://your-backend-url.com/api/payments/mpesa/callback"
MPESA_TIMEOUT_URL="https://your-backend-url.com/api/payments/mpesa/timeout"
```

### 3. Test Credentials (Sandbox)

**Paybill Number:** `174379`  
**Test Phone Number:** `254708374149` (or any number starting with 2547...)  
**Test Amount:** Any amount (e.g., `1` to `70000`)

**Note:** In sandbox, you'll get a simulated STK push. Real M-Pesa won't be charged.

---

## API Endpoints

### Initiate M-Pesa Payment
```http
POST /api/payments/mpesa/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "0712345678",
  "amount": 5000,
  "bookingId": "booking-id-here",
  "paymentType": "CONSULTATION"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent. Please check your phone and enter M-Pesa PIN.",
  "data": {
    "paymentId": "payment-id",
    "checkoutRequestID": "ws_CO_12345",
    "customerMessage": "Success. Request accepted..."
  }
}
```

### Check Payment Status
```http
GET /api/payments/mpesa/status/:paymentId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "clx...",
    "status": "COMPLETED",
    "amount": 5000,
    "transactionId": "NLJ7RT61SV",
    "createdAt": "2025-11-25T...",
    "verifiedAt": "2025-11-25T..."
  }
}
```

### Get Payment History
```http
GET /api/payments/history
Authorization: Bearer <token>
```

---

## Frontend Usage

The PaymentPage already supports M-Pesa:

1. User selects "M-Pesa" payment method
2. Enters phone number (e.g., `0712345678`)
3. Clicks "Pay with M-Pesa"
4. STK push sent to phone
5. User enters M-Pesa PIN
6. Payment auto-confirms via callback
7. User redirected to dashboard

**Phone Number Formats Accepted:**
- `0712345678`
- `254712345678`
- `+254712345678`
- `712345678`

---

## Testing Locally with ngrok

Since M-Pesa callbacks require HTTPS public URLs:

### 1. Install ngrok
```bash
npm install -g ngrok
# or download from https://ngrok.com/
```

### 2. Start your backend
```bash
cd backend
npm run dev
```

### 3. Create ngrok tunnel
```bash
ngrok http 5000
```

### 4. Update callback URL in `.env`
```env
MPESA_CALLBACK_URL="https://abc123.ngrok.io/api/payments/mpesa/callback"
MPESA_TIMEOUT_URL="https://abc123.ngrok.io/api/payments/mpesa/timeout"
```

### 5. Test payment
- Use sandbox phone number: `254708374149`
- Watch ngrok dashboard for callback: `http://localhost:4040`

---

## Production Setup

### 1. Get Live Credentials

1. Visit **https://developer.safaricom.co.ke/**
2. Complete **Go-Live** application:
   - Business registration (Certificate of Incorporation)
   - KRA PIN
   - Business bank account
   - Paybill/Till number from Safaricom

3. Approval takes **2-5 business days**

### 2. Update Environment Variables

```env
MPESA_CONSUMER_KEY="your-production-consumer-key"
MPESA_CONSUMER_SECRET="your-production-consumer-secret"
MPESA_SHORTCODE="123456"  # Your actual Paybill number
MPESA_PASSKEY="your-production-passkey"
MPESA_ENVIRONMENT="production"

MPESA_CALLBACK_URL="https://wakili-pro-backend.onrender.com/api/payments/mpesa/callback"
MPESA_TIMEOUT_URL="https://wakili-pro-backend.onrender.com/api/payments/mpesa/timeout"
```

### 3. Register Callback URLs

In Daraja portal:
1. Go to **"My Apps"** → Select your app
2. Register callback URLs:
   - Validation URL: `https://your-backend.com/api/payments/mpesa/callback`
   - Confirmation URL: `https://your-backend.com/api/payments/mpesa/callback`

---

## Transaction Flow

```
1. User clicks "Pay with M-Pesa"
   ↓
2. Frontend calls POST /api/payments/mpesa/initiate
   ↓
3. Backend creates pending payment in database
   ↓
4. Backend calls M-Pesa STK Push API
   ↓
5. M-Pesa sends push notification to user's phone
   ↓
6. User enters M-Pesa PIN on phone
   ↓
7. M-Pesa processes payment
   ↓
8. M-Pesa calls our callback URL with result
   ↓
9. Backend updates payment status to COMPLETED/FAILED
   ↓
10. Frontend polls payment status and shows result
```

---

## Error Handling

### Common Errors

**"Invalid Access Token"**
- Consumer key/secret incorrect
- Check credentials in Daraja dashboard

**"Invalid Phone Number"**
- Must be Kenyan number (254...)
- Format: 254712345678

**"Insufficient Funds"**
- User's M-Pesa balance too low
- Ask user to top up and retry

**"Transaction Cancelled"**
- User cancelled on phone
- Ask user to retry

**"Transaction Timeout"**
- User didn't enter PIN within 60 seconds
- Retry payment

---

## Features Implemented

✅ **STK Push (Lipa Na M-Pesa Online)**
✅ **Payment Status Polling**
✅ **Callback Handler** (Safaricom → Backend)
✅ **Timeout Handler**
✅ **Phone Number Validation & Formatting**
✅ **Payment History**
✅ **Transaction Verification**
✅ **Database Integration** (Prisma)
✅ **Booking Confirmation** (auto-update on payment)

---

## Security Notes

🔐 **Never expose:**
- Consumer Secret
- Passkey
- Access tokens

✅ **Callbacks:**
- M-Pesa callbacks have no authentication
- We verify by matching `checkoutRequestID` to database
- Always return `200 OK` to prevent Safaricom retries

✅ **Phone Numbers:**
- Validated before API call
- Formatted to M-Pesa standard (254...)

---

## Monitoring & Logs

All M-Pesa operations are logged via Winston:

```bash
# View logs
tail -f backend/logs/combined.log

# Search for M-Pesa activity
grep "M-Pesa" backend/logs/combined.log
```

**Key log events:**
- Token generation
- STK Push initiation
- Callback received
- Payment status changes
- Errors

---

## Testing Checklist

- [ ] Get sandbox credentials from Daraja portal
- [ ] Add credentials to `.env`
- [ ] Start backend with `npm run dev`
- [ ] Setup ngrok tunnel
- [ ] Update callback URL in `.env`
- [ ] Test payment with sandbox phone number
- [ ] Check callback received in ngrok dashboard
- [ ] Verify payment status updated in database
- [ ] Check booking status changed to CONFIRMED
- [ ] Test timeout scenario (don't enter PIN)
- [ ] Test cancellation (cancel on phone)
- [ ] Check error handling for invalid phone numbers

---

## Support

**Safaricom Daraja Support:**
- Email: apisupport@safaricom.co.ke
- Docs: https://developer.safaricom.co.ke/docs

**Integration Issues:**
- Check logs in `backend/logs/`
- Enable debug mode: `LOG_LEVEL=debug` in `.env`
- Test with sandbox first before going live

---

## Next Steps

1. **Get sandbox credentials** (5 minutes)
2. **Test locally with ngrok** (15 minutes)
3. **Deploy to staging** (test with sandbox)
4. **Apply for Go-Live** (2-5 days approval)
5. **Switch to production** (update credentials)
6. **Monitor transactions** (check logs & database)

🚀 **M-Pesa integration is production-ready and waiting for your credentials!**
