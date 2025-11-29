# Document Review Payment Flow - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DocumentsPage.tsx                                              │
│  ├─ Document List                                               │
│  ├─ "Request Review" Button ──────┐                            │
│  └─ Upload Modal                   │                            │
│                                    ▼                            │
│  ServiceSelectionModal.tsx                                      │
│  ├─ Step 1: Service Tier (AI/Cert/Both)                        │
│  ├─ Step 2: Urgency (Std/Urgent/Emergency)                     │
│  └─ Step 3: Review & Confirm ─────┐                            │
│                                    ▼                            │
│  Payment Method Selection                                       │
│  ├─ M-Pesa (Mobile)               ├─ Flutterwave (Card)        │
│  └─ Phone Input                   └─ Redirect to Checkout      │
│      │                                 │                        │
│      ▼                                 ▼                        │
│  PaymentStatusPoller.tsx         [External: Flutterwave]       │
│  ├─ Poll every 5s                     ├─ Card Form             │
│  ├─ Show "Check Phone"                ├─ Submit Payment        │
│  └─ Detect Success ──┐                └─ Redirect Back         │
│                      │                    │                     │
│                      │                    ▼                     │
│                      │              PaymentCallbackPage.tsx     │
│                      │              ├─ Extract transaction_id   │
│                      │              ├─ Verify with backend      │
│                      │              └─ Show Success/Fail        │
│                      │                    │                     │
│                      └────────────────────┘                     │
│                                    │                            │
│                                    ▼                            │
│                           Dashboard (Success!)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS API Calls
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  documentPayment.ts (Routes)                                    │
│  ├─ POST /api/document-payment/initiate                        │
│  ├─ POST /api/document-payment/mpesa-callback                  │
│  ├─ POST /api/document-payment/flutterwave-webhook             │
│  └─ GET  /api/document-payment/:id/status                      │
│           │                          │                          │
│           ▼                          ▼                          │
│  mpesaService.ts          flutterwaveService.ts                │
│  ├─ STK Push              ├─ Create Payment Link               │
│  ├─ Verify Callback       ├─ Verify Transaction                │
│  └─ Update Payment        └─ Process Webhook                   │
│           │                          │                          │
│           └──────────┬───────────────┘                          │
│                      ▼                                          │
│              Prisma ORM (Database)                              │
│              ├─ Payment Model                                   │
│              ├─ DocumentReview Model                            │
│              └─ UserDocument Model                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    │                       │
       ┌────────────┘                       └──────────────┐
       ▼                                                    ▼
┌──────────────────┐                           ┌──────────────────┐
│  M-Pesa Daraja   │                           │   Flutterwave    │
│      API         │                           │       API        │
├──────────────────┤                           ├──────────────────┤
│ • STK Push       │                           │ • Payment Link   │
│ • Callback       │                           │ • Webhook        │
│ • Status Query   │                           │ • Verify TX      │
└──────────────────┘                           └──────────────────┘
```

## M-Pesa Payment Flow (Detailed)

```
USER                FRONTEND              BACKEND              M-PESA
 │                     │                     │                   │
 │ 1. Select Service   │                     │                   │
 ├────────────────────>│                     │                   │
 │                     │                     │                   │
 │ 2. Choose M-Pesa    │                     │                   │
 ├────────────────────>│                     │                   │
 │                     │                     │                   │
 │ 3. Enter Phone      │                     │                   │
 │    (254712345678)   │                     │                   │
 ├────────────────────>│                     │                   │
 │                     │                     │                   │
 │                     │ 4. POST /initiate   │                   │
 │                     │ {documentId,        │                   │
 │                     │  serviceType,       │                   │
 │                     │  amount,            │                   │
 │                     │  phoneNumber}       │                   │
 │                     ├────────────────────>│                   │
 │                     │                     │                   │
 │                     │                     │ 5. STK Push       │
 │                     │                     ├──────────────────>│
 │                     │                     │                   │
 │                     │ 6. {paymentId}      │                   │
 │                     │<────────────────────┤                   │
 │                     │                     │                   │
 │ 7. "Check Phone"    │                     │                   │
 │<────────────────────┤                     │                   │
 │                     │                     │                   │
 │ 8. M-Pesa Prompt    │                     │                   │
 │<────────────────────┼─────────────────────┼───────────────────┤
 │                     │                     │                   │
 │ 9. Enter PIN        │                     │                   │
 ├─────────────────────┼─────────────────────┼──────────────────>│
 │                     │                     │                   │
 │                     │                     │ 10. Callback      │
 │                     │                     │<──────────────────┤
 │                     │                     │  {ResultCode: 0}  │
 │                     │                     │                   │
 │                     │                     │ 11. Update DB     │
 │                     │                     │  status=COMPLETED │
 │                     │                     │                   │
 │                     │ 12. Poll Status     │                   │
 │                     │  (every 5 seconds)  │                   │
 │                     ├────────────────────>│                   │
 │                     │                     │                   │
 │                     │ 13. {status: COMP.} │                   │
 │                     │<────────────────────┤                   │
 │                     │                     │                   │
 │ 14. Success! ✓      │                     │                   │
 │<────────────────────┤                     │                   │
 │                     │                     │                   │
 │ 15. Redirect →      │                     │                   │
 │     Dashboard       │                     │                   │
 │                     │                     │                   │
```

## Flutterwave Payment Flow (Detailed)

```
USER                FRONTEND              BACKEND           FLUTTERWAVE
 │                     │                     │                   │
 │ 1. Select Service   │                     │                   │
 ├────────────────────>│                     │                   │
 │                     │                     │                   │
 │ 2. Choose Card      │                     │                   │
 ├────────────────────>│                     │                   │
 │                     │                     │                   │
 │                     │ 3. POST /initiate   │                   │
 │                     │ {documentId,        │                   │
 │                     │  serviceType,       │                   │
 │                     │  amount,            │                   │
 │                     │  method: CARD}      │                   │
 │                     ├────────────────────>│                   │
 │                     │                     │                   │
 │                     │                     │ 4. Create Link    │
 │                     │                     ├──────────────────>│
 │                     │                     │                   │
 │                     │                     │ 5. {link, ref}    │
 │                     │                     │<──────────────────┤
 │                     │                     │                   │
 │                     │ 6. {paymentLink}    │                   │
 │                     │<────────────────────┤                   │
 │                     │                     │                   │
 │ 7. Redirect →       │                     │                   │
 │  checkout.flw.com   │                     │                   │
 ├─────────────────────┼─────────────────────┼──────────────────>│
 │                     │                     │                   │
 │ 8. Card Form        │                     │                   │
 │<────────────────────┼─────────────────────┼───────────────────┤
 │                     │                     │                   │
 │ 9. Enter Card       │                     │                   │
 │    Details          │                     │                   │
 ├─────────────────────┼─────────────────────┼──────────────────>│
 │                     │                     │                   │
 │                     │                     │ 10. Webhook       │
 │                     │                     │<──────────────────┤
 │                     │                     │  charge.completed │
 │                     │                     │                   │
 │                     │                     │ 11. Update DB     │
 │                     │                     │  status=COMPLETED │
 │                     │                     │                   │
 │ 12. Redirect Back   │                     │                   │
 │  /payment-callback? │                     │                   │
 │  tx_ref=payment_123 │                     │                   │
 │<────────────────────┼─────────────────────┼───────────────────┤
 │                     │                     │                   │
 │                     │ 13. Verify Status   │                   │
 │                     │  GET /status/:id    │                   │
 │                     ├────────────────────>│                   │
 │                     │                     │                   │
 │                     │ 14. {status: COMP.} │                   │
 │                     │<────────────────────┤                   │
 │                     │                     │                   │
 │ 15. Success! ✓      │                     │                   │
 │<────────────────────┤                     │                   │
 │                     │                     │                   │
 │ 16. Auto-redirect   │                     │                   │
 │     (3 seconds)     │                     │                   │
 │                     │                     │                   │
 │ 17. → Dashboard     │                     │                   │
 │                     │                     │                   │
```

## Database State Changes

```
INITIAL STATE:
┌──────────────────┐
│  UserDocument    │
│  ├─ id: doc_123  │
│  ├─ title: "..."  │
│  └─ status: DRAFT│
└──────────────────┘

AFTER PAYMENT INITIATION:
┌──────────────────┐     ┌─────────────────────┐
│  UserDocument    │     │  Payment            │
│  ├─ id: doc_123  │     │  ├─ id: pay_456     │
│  ├─ title: "..."  │     │  ├─ amount: 5.00    │
│  └─ status: DRAFT│     │  ├─ status: PENDING │
└──────────────────┘     │  ├─ method: MPESA   │
                         │  └─ documentReviewId│
                         └─────────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │  DocumentReview     │
                         │  ├─ id: rev_789     │
                         │  ├─ documentId      │
                         │  ├─ serviceType     │
                         │  ├─ urgencyLevel    │
                         │  └─ status: PENDING │
                         └─────────────────────┘

AFTER PAYMENT SUCCESS:
┌──────────────────────┐     ┌──────────────────────┐
│  UserDocument        │     │  Payment             │
│  ├─ id: doc_123      │     │  ├─ id: pay_456      │
│  ├─ title: "..."      │     │  ├─ amount: 5.00     │
│  └─ status:          │     │  ├─ status: COMPLETED│
│      UNDER_REVIEW    │     │  ├─ transactionId    │
└──────────────────────┘     │  └─ completedAt      │
                             └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │  DocumentReview      │
                             │  ├─ id: rev_789      │
                             │  ├─ status:          │
                             │  │   PAYMENT_RECEIVED│
                             │  ├─ assignedLawyerId │
                             │  └─ estimatedDelivery│
                             └──────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Error Scenarios                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. NETWORK ERROR                                       │
│     ├─ Catch in try/catch                              │
│     ├─ Show: "Network error, please try again"         │
│     └─ Allow retry                                      │
│                                                         │
│  2. M-PESA USER CANCELS                                 │
│     ├─ Callback: ResultCode = 1032                     │
│     ├─ Update Payment: status = CANCELLED               │
│     ├─ Polling detects CANCELLED                        │
│     └─ Show: "Payment cancelled"                        │
│                                                         │
│  3. M-PESA TIMEOUT                                      │
│     ├─ No callback received within 60 seconds          │
│     ├─ Polling reaches maxAttempts (60)                │
│     └─ Show: "Payment timed out, check history"        │
│                                                         │
│  4. FLUTTERWAVE CARD DECLINED                           │
│     ├─ Webhook: status = failed                         │
│     ├─ Update Payment: status = FAILED                  │
│     ├─ Redirect includes: status=failed                │
│     └─ Show: "Payment failed, try different card"      │
│                                                         │
│  5. INSUFFICIENT BALANCE                                │
│     ├─ M-Pesa: ResultCode = 1                          │
│     ├─ Callback updates: metadata.failureReason        │
│     └─ Show: "Insufficient balance"                     │
│                                                         │
│  6. INVALID PHONE NUMBER                                │
│     ├─ Frontend validation fails                        │
│     └─ Show: "Invalid phone number format"             │
│                                                         │
│  7. DUPLICATE PAYMENT                                   │
│     ├─ Backend checks existing pending payment         │
│     └─ Show: "Payment already in progress"             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Interaction Map

```
┌──────────────────────────────────────────────────────────┐
│                    DocumentsPage.tsx                     │
│                                                          │
│  State Management:                                       │
│  ├─ documents: Document[]                               │
│  ├─ showServiceModal: boolean                           │
│  ├─ selectedDocument: {id, title}                       │
│  └─ paymentInProgress: {paymentId, method}             │
│                                                          │
│  Event Handlers:                                         │
│  ├─ handleRequestReview(docId, title)                  │
│  ├─ handleServiceConfirm(selection)                    │
│  ├─ selectPaymentMethod() → "MPESA"|"CARD"            │
│  ├─ getPhoneNumber() → "254..."                        │
│  ├─ handlePaymentSuccess(payment)                      │
│  └─ handlePaymentError(error)                          │
│                                                          │
│  Rendered Components:                                    │
│  ├─ Document List (with "Request Review" buttons)      │
│  ├─ ServiceSelectionModal (conditional)                │
│  └─ PaymentStatusPoller (conditional)                  │
│                                                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ Props Flow
                   ▼
┌──────────────────────────────────────────────────────────┐
│             ServiceSelectionModal.tsx                    │
│                                                          │
│  Props:                                                  │
│  ├─ isOpen: boolean                                     │
│  ├─ onClose: () => void                                 │
│  ├─ documentId: string                                  │
│  ├─ documentTitle: string                               │
│  └─ onConfirm: (selection) => void                      │
│                                                          │
│  Internal State:                                         │
│  ├─ step: 1 | 2 | 3                                     │
│  ├─ selectedService: ServiceTier                        │
│  └─ selectedUrgency: UrgencyLevel                       │
│                                                          │
│  Steps:                                                  │
│  ├─ Step 1: Service Selection                          │
│  │   └─ AI Only ($5) | Cert ($15) | Both ($18)        │
│  ├─ Step 2: Urgency Selection                          │
│  │   └─ Std (1x) | Urgent (1.5x) | Emergency (2x)     │
│  └─ Step 3: Review & Confirm                           │
│      └─ Shows total price, calls onConfirm()           │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│             PaymentStatusPoller.tsx                      │
│                                                          │
│  Props:                                                  │
│  ├─ paymentId: string                                   │
│  ├─ paymentMethod: "MPESA" | "FLUTTERWAVE"             │
│  ├─ onSuccess: (payment) => void                        │
│  └─ onError: (error) => void                            │
│                                                          │
│  Internal State:                                         │
│  ├─ status: "pending" | "processing" | "success" | ...  │
│  ├─ attempts: number                                     │
│  └─ timeElapsed: number (seconds)                       │
│                                                          │
│  Logic:                                                  │
│  ├─ useEffect: Start polling on mount                   │
│  ├─ Poll every 5 seconds                                │
│  ├─ Max 60 attempts (5 minutes)                         │
│  ├─ Call onSuccess when status = COMPLETED              │
│  └─ Call onError when status = FAILED or timeout        │
│                                                          │
│  UI:                                                     │
│  ├─ Modal overlay                                        │
│  ├─ Loading spinner or success/error icon              │
│  ├─ Context-aware message                               │
│  └─ Timer display                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│             PaymentCallbackPage.tsx                      │
│                                                          │
│  URL Params:                                             │
│  ├─ transaction_id: string (Flutterwave TX ID)          │
│  ├─ tx_ref: string (format: payment_<id>_<timestamp>)  │
│  └─ status: "successful" | "failed"                     │
│                                                          │
│  Internal State:                                         │
│  ├─ status: "verifying" | "success" | "failed"         │
│  ├─ message: string                                      │
│  └─ paymentDetails: Payment object                      │
│                                                          │
│  Logic:                                                  │
│  ├─ useEffect: Verify on mount                          │
│  ├─ Extract payment ID from tx_ref                      │
│  ├─ Call GET /document-payment/:id/status              │
│  ├─ If PENDING, retry after 3 seconds                  │
│  ├─ If COMPLETED, show success & redirect               │
│  └─ If FAILED, show error with support links            │
│                                                          │
│  UI:                                                     │
│  ├─ Full-screen centered card                           │
│  ├─ Spinner / Success / Error icon                      │
│  ├─ Payment details display                             │
│  └─ Action buttons (Back to Docs / Contact Support)    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Modal-Based Service Selection**
**Why:** Better UX than separate page navigation, keeps user in context

### 2. **Polling vs WebSocket**
**Why:** Simpler implementation, works with serverless backends, no persistent connections

### 3. **Separate M-Pesa and Flutterwave Flows**
**Why:** Different payment experiences (push vs redirect), optimal UX for each

### 4. **Payment Method Dialog (Simple)**
**Why:** Quick implementation, can be enhanced later with custom modal

### 5. **3-Second Auto-Redirect on Success**
**Why:** Gives user time to see confirmation, improves perceived reliability

### 6. **Payment ID in tx_ref**
**Why:** Allows Flutterwave callback to identify payment without backend lookup

### 7. **Status Polling Every 5 Seconds**
**Why:** Balance between responsiveness and server load

### 8. **60-Attempt Timeout (5 minutes)**
**Why:** M-Pesa STK push expires after 60 seconds, extra time for processing

---

## Future Enhancements Roadmap

### Phase 1: UX Improvements (2-3 days)
- [ ] Custom Payment Method Selector Modal
- [ ] Inline Phone Number Input with Formatting
- [ ] Better Error Messages with Resolution Steps
- [ ] Loading Skeletons for Better Perceived Performance

### Phase 2: Features (1 week)
- [ ] Payment History Page
- [ ] Download Payment Receipts
- [ ] Retry Failed Payments
- [ ] Save Preferred Payment Method
- [ ] Multiple Phone Numbers Support

### Phase 3: Advanced (2 weeks)
- [ ] WebSocket for Real-Time Updates
- [ ] Wallet System (Pre-fund Account)
- [ ] Airtel Money Integration
- [ ] Bulk Payment Discounts
- [ ] Referral Payment Credits

### Phase 4: Analytics (1 week)
- [ ] Payment Conversion Tracking
- [ ] Failed Payment Analysis
- [ ] Revenue Dashboard
- [ ] Payment Method Performance Metrics

---

**Implementation Complete:** November 29, 2025  
**Developer:** AI Assistant (GitHub Copilot)  
**Status:** ✅ Ready for Testing
