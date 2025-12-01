# Payment Architecture - Unified M-Pesa Integration

## Overview
Wakili Pro uses a **SINGLE unified M-Pesa payment endpoint** for all payment types. This document serves as the authoritative reference for payment integration.

## Core Principle
**ONE endpoint to rule them all**: `/api/payments/mpesa/initiate`

## Architecture Components

### Backend Files
```
backend/src/
├── controllers/mpesaController.ts    # Main payment logic
├── services/mpesaDarajaService.ts    # M-Pesa Daraja API integration
├── routes/mpesaRoutes.ts             # Payment route definitions
└── middleware/authMiddleware.ts      # authenticateToken middleware
```

### Frontend Integration Points
```
frontend/src/
├── pages/PaymentPage.tsx                # General payment page
├── pages/DocumentsPage.tsx              # Document review payments
├── pages/MarketplaceBrowse.tsx          # Marketplace purchases
├── components/SubscriptionDashboard.tsx # Subscription upgrades
└── lib/axios.ts                         # axiosInstance (authenticated)
```

## Payment Flow

### 1. Resource Creation
Create the resource first (booking, subscription, purchase, etc.) to get its ID and amount.

```typescript
// Example: Creating a subscription
const response = await axiosInstance.post('/api/subscriptions/create', {
  targetTier: 'LITE',
  billingCycle: 'monthly'
});

const { subscriptionId, amount } = response.data.data;
```

### 2. Payment Initiation
Use the unified endpoint with the appropriate resource ID.

```typescript
const paymentResponse = await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 2999,
  subscriptionId: subscriptionId,
  paymentType: 'SUBSCRIPTION_LITE' // Optional metadata
});

const { paymentId, customerMessage } = paymentResponse.data.data;
```

### 3. User Interaction
Display M-Pesa prompt message to user:
```typescript
alert(customerMessage); // "Please check your phone (254712345678) and enter your M-Pesa PIN"
```

### 4. Status Polling
Poll the unified status endpoint until payment completes:

```typescript
let attempts = 0;
const maxAttempts = 20; // 1 minute (20 × 3 seconds)

const pollInterval = setInterval(async () => {
  attempts++;
  
  const statusResponse = await axiosInstance.get(`/api/payments/mpesa/status/${paymentId}`);
  
  if (statusResponse.data.success) {
    const { status } = statusResponse.data.data;
    
    if (status === 'COMPLETED') {
      clearInterval(pollInterval);
      // Payment successful - redirect user
      navigate('/dashboard');
    } else if (status === 'FAILED') {
      clearInterval(pollInterval);
      // Payment failed - show error
      alert('Payment failed. Please try again.');
    }
  }
  
  if (attempts >= maxAttempts) {
    clearInterval(pollInterval);
    alert('Payment verification timed out. Please check your payment history.');
  }
}, 3000); // Poll every 3 seconds
```

### 5. Callback Processing (Automatic)
M-Pesa calls `/api/payments/mpesa/callback` automatically. The backend:
- Updates payment status (COMPLETED/FAILED)
- Activates subscriptions
- Updates lawyer tier for subscriptions
- Marks bookings as paid
- Unlocks purchased documents

**No frontend action needed** - callback is server-to-server.

## Supported Payment Types

### 1. Legal Consultations
**Parameter**: `bookingId`
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 5000,
  bookingId: 'booking-uuid-here',
  paymentType: 'CONSULTATION'
});
```

### 2. Marketplace Documents
**Parameter**: `purchaseId`
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 1500,
  purchaseId: 'purchase-uuid-here',
  paymentType: 'MARKETPLACE_PURCHASE'
});
```

### 3. Document Reviews
**Parameter**: `reviewId`

#### AI-Only Review
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 500,
  reviewId: 'review-uuid-here',
  paymentType: 'DOCUMENT_REVIEW_AI'
});
```

#### Lawyer Certification
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 2000,
  reviewId: 'review-uuid-here',
  paymentType: 'DOCUMENT_CERTIFICATION'
});
```

#### AI + Certification Combo
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 2500,
  reviewId: 'review-uuid-here',
  paymentType: 'DOCUMENT_REVIEW_COMBO'
});
```

### 4. Service Request Commitment Fee
**Parameter**: `reviewId`
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 500,
  reviewId: 'service-request-uuid',
  paymentType: 'SERVICE_REQUEST_COMMITMENT'
});
```

### 5. Lawyer Subscriptions
**Parameter**: `subscriptionId`

#### LITE Tier (KES 2,999/month)
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 2999,
  subscriptionId: 'subscription-uuid-here',
  paymentType: 'SUBSCRIPTION_LITE'
});
```

#### PRO Tier (KES 4,999/month)
```typescript
await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 4999,
  subscriptionId: 'subscription-uuid-here',
  paymentType: 'SUBSCRIPTION_PRO'
});
```

## Backend Controller Logic

### Parameter Validation
The controller validates that exactly ONE resource ID is provided:

```typescript
// backend/src/controllers/mpesaController.ts
const { phoneNumber, amount, bookingId, reviewId, purchaseId, subscriptionId } = req.body;

// Validate resource exists based on provided ID
if (bookingId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  // Validate booking...
} else if (purchaseId) {
  const purchase = await prisma.documentPurchase.findUnique({ where: { id: purchaseId } });
  // Validate purchase...
} else if (reviewId) {
  const review = await prisma.documentReview.findUnique({ where: { id: reviewId } });
  // Validate review...
} else if (subscriptionId) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  // Validate subscription...
}
```

### Resource Type Metadata
Each payment stores its resource type for callback processing:

```typescript
const metadata = {
  resourceType: 'BOOKING' | 'PURCHASE' | 'REVIEW' | 'SUBSCRIPTION',
  bookingId: bookingId || null,
  purchaseId: purchaseId || null,
  reviewId: reviewId || null,
  subscriptionId: subscriptionId || null
};
```

### Callback Handler
Processes successful payments based on resource type:

```typescript
// backend/src/controllers/mpesaController.ts - handleCallback()
if (metadata.resourceType === 'BOOKING') {
  await prisma.booking.update({ where: { id: metadata.bookingId }, data: { status: 'CONFIRMED' } });
}
else if (metadata.resourceType === 'PURCHASE') {
  await prisma.documentPurchase.update({ where: { id: metadata.purchaseId }, data: { status: 'COMPLETED' } });
}
else if (metadata.resourceType === 'REVIEW') {
  await prisma.documentReview.update({ where: { id: metadata.reviewId }, data: { paymentStatus: 'PAID' } });
}
else if (metadata.resourceType === 'SUBSCRIPTION') {
  const subscription = await prisma.subscription.update({
    where: { id: metadata.subscriptionId },
    data: { status: 'ACTIVE', activatedAt: new Date() }
  });
  
  // Update lawyer tier
  await prisma.lawyerProfile.update({
    where: { userId: subscription.userId },
    data: { tier: subscription.tier, subscriptionStatus: 'ACTIVE' }
  });
}
```

## Environment Variables

### Development (Sandbox)
```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_CALLBACK_URL=https://your-backend.com/api/payments/mpesa/callback
```

### Production (Live)
```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://wakili-pro-backend.onrender.com/api/payments/mpesa/callback
```

## Phone Number Format
M-Pesa requires Kenyan phone numbers in international format:

```typescript
// ✅ Correct formats
'254712345678'  // 12 digits, starts with 254
'254722345678'  // Safaricom
'254733345678'  // Airtel

// ❌ Wrong formats
'0712345678'    // Missing country code
'712345678'     // Missing prefix
'+254712345678' // Has + symbol (remove it)
'254 712 345678' // Has spaces
```

### Frontend Validation
```typescript
const formatPhoneNumber = (phone: string): string => {
  // Remove spaces, dashes, plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};
```

## Error Handling

### Common Errors

**Insufficient Balance**
```json
{
  "success": false,
  "message": "The initiator information is invalid.",
  "errorCode": "INSUFFICIENT_BALANCE"
}
```

**Invalid Phone Number**
```json
{
  "success": false,
  "message": "The phone number is invalid",
  "errorCode": "INVALID_PHONE"
}
```

**Payment Timeout**
```json
{
  "success": false,
  "message": "Request timeout - user did not enter PIN",
  "errorCode": "TIMEOUT"
}
```

**User Cancelled**
```json
{
  "success": false,
  "message": "User cancelled the transaction",
  "errorCode": "USER_CANCELLED"
}
```

### Frontend Error Display
```typescript
try {
  const response = await axiosInstance.post('/api/payments/mpesa/initiate', paymentData);
  // Handle success...
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'Payment failed. Please try again.';
  
  if (errorMessage.includes('invalid phone')) {
    alert('Please enter a valid Safaricom or Airtel number (e.g., 0712345678)');
  } else if (errorMessage.includes('insufficient')) {
    alert('Insufficient M-Pesa balance. Please top up and try again.');
  } else {
    alert(errorMessage);
  }
}
```

## Testing

### Sandbox Test Numbers (Safaricom)
```
254708374149  # Test number 1
254711111111  # Test number 2
254722000000  # Test number 3
```

### Test Amounts
```
1     # Simulates success
2-99  # Simulates user cancellation
100+  # Simulates insufficient funds
```

### Manual Test Flow
1. Create resource (subscription, booking, etc.)
2. Initiate payment with test phone number
3. Check logs for STK push request
4. Manually trigger callback (or wait for auto-callback)
5. Verify resource status updated
6. Check payment status endpoint

## Migration Guide

### Adding a New Payment Type

1. **Add parameter to controller**
```typescript
// backend/src/controllers/mpesaController.ts
const { phoneNumber, amount, bookingId, reviewId, purchaseId, subscriptionId, newResourceId } = req.body;
```

2. **Add validation block**
```typescript
else if (newResourceId) {
  const newResource = await prisma.newResource.findUnique({ where: { id: newResourceId } });
  if (!newResource) throw new Error('Resource not found');
  resourceType = 'NEW_RESOURCE';
  accountReference = `NEW-${newResourceId.substring(0, 8)}`;
  transactionDesc = `Payment for ${newResource.title}`;
}
```

3. **Add to metadata**
```typescript
const metadata = {
  resourceType: 'BOOKING' | 'PURCHASE' | 'REVIEW' | 'SUBSCRIPTION' | 'NEW_RESOURCE',
  // ... existing fields
  newResourceId: newResourceId || null
};
```

4. **Add callback handler**
```typescript
else if (metadata.resourceType === 'NEW_RESOURCE') {
  await prisma.newResource.update({
    where: { id: metadata.newResourceId },
    data: { status: 'PAID', paidAt: new Date() }
  });
}
```

5. **Update frontend**
```typescript
const paymentResponse = await axiosInstance.post('/api/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: 1000,
  newResourceId: resourceId,
  paymentType: 'NEW_RESOURCE_TYPE'
});
```

**DO NOT** create a new payment endpoint or controller!

## Production Checklist

- [ ] Update `MPESA_ENVIRONMENT=production`
- [ ] Set production consumer key/secret
- [ ] Configure production business shortcode
- [ ] Set production passkey
- [ ] Update callback URL to production domain
- [ ] Test with real M-Pesa account (small amount)
- [ ] Monitor callback logs for first 24 hours
- [ ] Set up payment failure alerts
- [ ] Document production support contacts

## Support & Troubleshooting

### Common Issues

**Callback not received**
- Check callback URL is publicly accessible
- Verify no firewall blocking Safaricom IPs
- Check backend logs for incoming POST requests
- Test callback URL with Postman/curl

**Payment stuck in PENDING**
- User may not have entered PIN
- Check M-Pesa transaction status manually
- Verify callback URL in M-Pesa portal
- Check if amount was deducted from user

**Invalid credentials**
- Verify consumer key/secret match environment
- Check business shortcode is correct
- Ensure passkey matches shortcode
- Regenerate credentials if compromised

### Logs to Check
```bash
# Backend logs
tail -f backend/logs/combined.log | grep "MPESA"

# Payment-specific logs
tail -f backend/logs/payments.log

# Callback logs
tail -f backend/logs/callbacks.log
```

### Support Contacts
- **M-Pesa API Support**: apiservice@safaricom.co.ke
- **Developer Portal**: https://developer.safaricom.co.ke
- **Slack Community**: https://safaricomdevelopers.slack.com

---

**Last Updated**: December 1, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
