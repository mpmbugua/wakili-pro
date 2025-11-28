# Wakili Pro - Complete E2E Implementation Roadmap

## 🎯 Project Overview
Complete implementation of lawyer booking platform with three distinct service models:
1. **Consultation Bookings** - Video/Phone/In-person sessions
2. **Emergency Direct Calls** - AI/Receptionist-assisted urgent legal help
3. **Marketplace Services** - Job-based legal services (already implemented)

---

## 📋 PHASE 1: FOUNDATION & QUICK WINS (Week 1)

### ✅ **1.1 Emergency Contact Display** - PRIORITY: HIGH
**Objective:** Show emergency numbers on all pages
**Files to modify:**
- `frontend/src/components/layout/Footer.tsx` - Add emergency section
- `frontend/src/components/EmergencyCallButton.tsx` - Create floating button
- `frontend/src/pages/HomePage.tsx` - Add emergency banner

**Implementation:**
```tsx
// EmergencyCallButton.tsx
- Floating button bottom-right
- Numbers: 0727114573, 0787679378
- Click to call functionality
- "Need Urgent Legal Help?" text
- Pulsing animation for attention
```

**Estimated Time:** 2 hours
**Status:** NOT STARTED

---

### ✅ **1.2 Database Schema Updates** - PRIORITY: CRITICAL
**Objective:** Add all required models for booking system

**New Models to Add:**

#### A. LawyerProfile Enhancements
```prisma
// Add to existing LawyerProfile model
hourlyRate                    Decimal?    @db.Decimal(10, 2)
offPeakHourlyRate            Decimal?    @db.Decimal(10, 2)
available24_7                Boolean     @default(false)
workingHours                 Json?
blockedSlots                 Json?
googleCalendarConnected      Boolean     @default(false)
googleCalendarId             String?
outlookCalendarConnected     Boolean     @default(false)
outlookCalendarId            String?
calendarSyncEnabled          Boolean     @default(false)
lastCalendarSync             DateTime?
```

#### B. LawyerWallet (New Model)
```prisma
model LawyerWallet {
  id                String    @id @default(cuid())
  lawyerId          String    @unique
  balance           Decimal   @default(0) @db.Decimal(10, 2)
  pendingBalance    Decimal   @default(0) @db.Decimal(10, 2)
  availableBalance  Decimal   @default(0) @db.Decimal(10, 2)
  currency          String    @default("KES")
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  lawyer            LawyerProfile @relation(fields: [lawyerId], references: [id])
  transactions      WalletTransaction[]
}
```

#### C. WalletTransaction (New Model)
```prisma
model WalletTransaction {
  id                      String    @id @default(cuid())
  walletId                String
  type                    String
  amount                  Decimal   @db.Decimal(10, 2)
  balanceBefore           Decimal   @db.Decimal(10, 2)
  balanceAfter            Decimal   @db.Decimal(10, 2)
  status                  String    @default("PENDING")
  paymentMethod           String?
  mpesaTransactionId      String?
  mpesaReceiptNumber      String?
  consultationBookingId   String?
  marketplaceBookingId    String?
  description             String?
  metadata                Json?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  wallet                  LawyerWallet @relation(fields: [walletId], references: [id])
}
```

#### D. ConsultationBooking (New Model)
```prisma
model ConsultationBooking {
  id                      String    @id @default(cuid())
  clientId                String
  lawyerId                String
  scheduledStartTime      DateTime
  scheduledEndTime        DateTime
  duration                Int
  consultationType        String
  clientPaymentAmount     Decimal   @db.Decimal(10, 2)
  platformCommissionRate  Decimal   @db.Decimal(5, 2)
  platformCommission      Decimal   @db.Decimal(10, 2)
  lawyerPayout            Decimal   @db.Decimal(10, 2)
  clientPaymentStatus     String    @default("PENDING")
  mpesaTransactionId      String?
  mpesaReceiptNumber      String?
  clientPaidAt            DateTime?
  status                  String    @default("PENDING_PAYMENT")
  actualStartTime         DateTime?
  actualEndTime           DateTime?
  lawyerConfirmed         Boolean   @default(false)
  clientConfirmed         Boolean   @default(false)
  lawyerConfirmedAt       DateTime?
  clientConfirmedAt       DateTime?
  payoutStatus            String    @default("PENDING")
  payoutTransactionId     String?
  paidToLawyerAt          DateTime?
  isEmergency             Boolean   @default(false)
  emergencyNotes          String?
  createdByReceptionist   Boolean   @default(false)
  receptionistId          String?
  callSid                 String?
  callDuration            Int?
  callRecordingUrl        String?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  client                  User      @relation("ClientConsultations", fields: [clientId], references: [id])
  lawyer                  User      @relation("LawyerConsultations", fields: [lawyerId], references: [id])
  review                  ConsultationReview?
}
```

#### E. ConsultationReview (New Model)
```prisma
model ConsultationReview {
  id              String    @id @default(cuid())
  bookingId       String    @unique
  rating          Int
  comment         String?
  wouldRecommend  Boolean
  createdAt       DateTime  @default(now())
  
  booking         ConsultationBooking @relation(fields: [bookingId], references: [id])
}
```

#### F. WithdrawalRequest (New Model)
```prisma
model WithdrawalRequest {
  id                String    @id @default(cuid())
  lawyerId          String
  amount            Decimal   @db.Decimal(10, 2)
  withdrawalMethod  String
  mpesaPhoneNumber  String?
  mpesaName         String?
  bankName          String?
  accountNumber     String?
  accountName       String?
  branchCode        String?
  status            String    @default("PENDING")
  requestedAt       DateTime  @default(now())
  processedAt       DateTime?
  completedAt       DateTime?
  rejectionReason   String?
  processedBy       String?
  transactionId     String?
  mpesaTransactionId String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  lawyer            LawyerProfile @relation(fields: [lawyerId], references: [id])
}
```

#### G. EmergencyContact (New Model)
```prisma
model EmergencyContact {
  id            String    @id @default(cuid())
  phoneNumber   String
  label         String
  isActive      Boolean   @default(true)
  displayOrder  Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Migration Steps:**
1. Update schema.prisma
2. Run `npx prisma migrate dev --name add-booking-wallet-system`
3. Run `npx prisma generate`
4. Update seed.ts to create emergency contacts

**Estimated Time:** 4 hours
**Status:** NOT STARTED

---

### ✅ **1.3 Lawyer Onboarding Enhancement** - PRIORITY: HIGH
**Objective:** Add rates, availability, and working hours to onboarding

**Files to modify:**
- `frontend/src/pages/auth/LawyerOnboarding.tsx` - Add step 5
- `backend/src/controllers/lawyerController.ts` - Update profile creation

**New Step 5: Rates & Availability**
```tsx
// Fields:
- Hourly Rate (required)
- Off-Peak Rate (optional)
- 24/7 Availability (toggle)
- Working Hours (Mon-Sun time selectors)
- Auto-created wallet on profile completion
```

**Estimated Time:** 4 hours
**Status:** NOT STARTED

---

## 📋 PHASE 2: M-PESA INTEGRATION (Week 2)

### ✅ **2.1 M-Pesa Daraja API Setup** - PRIORITY: CRITICAL
**Objective:** Integrate M-Pesa for payments

**Services Needed:**
- STK Push (Client payments)
- C2B (Client to Business)
- B2C (Lawyer payouts)
- Transaction Status Query

**Files to create:**
- `backend/src/services/mpesaService.ts`
- `backend/src/controllers/mpesaController.ts`
- `backend/src/routes/mpesa.ts`

**Implementation:**
```typescript
// mpesaService.ts functions:
1. initiateSTKPush(phone, amount, reference)
2. stkPushCallback(data)
3. initiateB2C(phone, amount, reason) // For payouts
4. queryTransactionStatus(checkoutId)
5. generateAccessToken()
```

**Environment Variables:**
```env
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_CALLBACK_URL=
MPESA_ENVIRONMENT=sandbox|production
```

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **2.2 Escrow Payment System** - PRIORITY: HIGH
**Objective:** Hold client payments until session confirmed

**Files to create:**
- `backend/src/services/escrowService.ts`
- `backend/src/controllers/paymentController.ts`

**Functions:**
```typescript
1. holdPayment(bookingId, amount, mpesaRef)
2. releaseToLawyer(bookingId)
3. refundToClient(bookingId, reason)
4. calculateCommission(amount, lawyerTier)
```

**Estimated Time:** 6 hours
**Status:** NOT STARTED

---

## 📋 PHASE 3: CONSULTATION BOOKING SYSTEM (Week 2-3)

### ✅ **3.1 Availability Management** - PRIORITY: HIGH
**Objective:** Lawyers manage calendar and availability

**Backend APIs:**
```
POST   /api/lawyers/availability/block
DELETE /api/lawyers/availability/:id
GET    /api/lawyers/availability
GET    /api/lawyers/:id/available-slots
```

**Frontend Components:**
- `CalendarManagement.tsx` - Lawyer blocks time
- `AvailabilityChecker.tsx` - Shows available slots to clients

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **3.2 Booking Creation Flow** - PRIORITY: CRITICAL
**Objective:** Complete consultation booking workflow

**Backend APIs:**
```
POST   /api/consultations/create
GET    /api/consultations/:id
GET    /api/consultations/my-bookings
POST   /api/consultations/:id/pay
POST   /api/consultations/:id/start
POST   /api/consultations/:id/end
POST   /api/consultations/:id/confirm
POST   /api/consultations/:id/review
```

**Frontend Components:**
- `BookingForm.tsx` - Select time, duration, type
- `BookingPayment.tsx` - M-Pesa payment
- `BookingConfirmation.tsx` - Success page
- `SessionControls.tsx` - Start/End buttons for lawyer
- `SessionReview.tsx` - Client review form

**Estimated Time:** 12 hours
**Status:** NOT STARTED

---

### ✅ **3.3 Session Confirmation & Payout** - PRIORITY: CRITICAL
**Objective:** Both parties confirm, trigger payout

**Logic:**
```typescript
// After session ends:
1. Lawyer clicks "Confirm Completion"
2. Client gets notification to confirm
3. Client clicks "Confirm" (24hr window)
4. BOTH confirmed → Calculate payout
5. Deduct platform commission
6. Credit lawyer wallet
7. Send payout notification
8. Request review from client
```

**Auto-release:** If client doesn't respond in 24hrs, auto-confirm and release

**Estimated Time:** 6 hours
**Status:** NOT STARTED

---

## 📋 PHASE 4: EMERGENCY CALL SYSTEM (Week 3)

### ✅ **4.1 Emergency Contact Integration** - PRIORITY: MEDIUM
**Objective:** Direct call handling

**Components:**
- Seed emergency numbers in database
- Display on homepage, footer, floating button
- Click-to-call functionality

**Estimated Time:** 3 hours
**Status:** NOT STARTED

---

### ✅ **4.2 AI/Receptionist Booking Interface** - PRIORITY: MEDIUM
**Objective:** Admin creates bookings for callers

**Backend API:**
```
POST /api/admin/emergency-booking/create
GET  /api/admin/lawyers/available-now
POST /api/admin/emergency-booking/assign
```

**Frontend:**
- `EmergencyBookingForm.tsx` - Admin interface
- Shows available lawyers in real-time
- Creates booking with isEmergency=true
- Sends M-Pesa payment request to caller

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **4.3 In-App Calling (Twilio/AfricasTalking)** - PRIORITY: LOW
**Objective:** VOIP calling like Uber

**Integration:**
- AfricasTalking Voice API
- Call masking (hide real numbers)
- Call recording
- Call duration tracking

**Components:**
- `CallInterface.tsx` - Call controls
- `CallButton.tsx` - Initiate call
- Option: "Use my phone" or "Call in-app"

**Estimated Time:** 12 hours
**Status:** NOT STARTED

---

## 📋 PHASE 5: LAWYER WALLET SYSTEM (Week 3-4)

### ✅ **5.1 Wallet Deposit** - PRIORITY: HIGH
**Objective:** Lawyers deposit funds for marketplace jobs

**Backend APIs:**
```
POST /api/lawyer/wallet/deposit
GET  /api/lawyer/wallet/balance
GET  /api/lawyer/wallet/transactions
```

**Frontend:**
- `WalletCard.tsx` - Show balance
- `DepositModal.tsx` - M-Pesa deposit
- Auto-credit on payment confirmation

**Estimated Time:** 6 hours
**Status:** NOT STARTED

---

### ✅ **5.2 Wallet Withdrawal** - PRIORITY: HIGH
**Objective:** Lawyers withdraw earnings

**Backend APIs:**
```
POST /api/lawyer/wallet/withdraw/request
GET  /api/lawyer/wallet/withdrawals
POST /api/admin/wallet/withdrawal/:id/approve
POST /api/admin/wallet/withdrawal/:id/process
```

**Frontend:**
- `WithdrawalModal.tsx` - Request withdrawal
- `WithdrawalHistory.tsx` - Track requests
- `AdminWithdrawalQueue.tsx` - Admin approvals

**B2C Integration:** Process approved withdrawals via M-Pesa B2C

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **5.3 Transaction History** - PRIORITY: MEDIUM
**Objective:** Complete audit trail

**Components:**
- `TransactionList.tsx` - All transactions
- Filters by type, date, status
- Export to PDF/CSV

**Estimated Time:** 4 hours
**Status:** NOT STARTED

---

## 📋 PHASE 6: NOTIFICATIONS (Week 4)

### ✅ **6.1 SMS Integration (AfricasTalking)** - PRIORITY: HIGH
**Objective:** SMS notifications and OTP

**Services:**
- Booking confirmations
- Payment confirmations
- Session reminders
- OTP for password reset
- Withdrawal confirmations

**Files to create:**
- `backend/src/services/smsService.ts`
- `backend/src/services/otpService.ts`

**Estimated Time:** 6 hours
**Status:** NOT STARTED

---

### ✅ **6.2 Email Notifications** - PRIORITY: MEDIUM
**Objective:** Email confirmations

**Use:** SendGrid or AWS SES
**Templates:**
- Booking confirmation
- Payment receipt
- Session summary
- Withdrawal processed

**Estimated Time:** 4 hours
**Status:** NOT STARTED

---

### ✅ **6.3 In-App Notifications** - PRIORITY: MEDIUM
**Objective:** Real-time notifications

**Already partially implemented**, enhance with:
- Booking notifications
- Payment notifications
- Session reminders (15 min before)
- Review requests

**Estimated Time:** 4 hours
**Status:** NOT STARTED

---

## 📋 PHASE 7: CALENDAR INTEGRATION (Week 4-5)

### ✅ **7.1 Google Calendar Sync** - PRIORITY: MEDIUM
**Objective:** Sync lawyer availability

**OAuth2 Flow:**
1. Lawyer connects Google account
2. Grant calendar access
3. Sync events bidirectionally
4. Auto-block time from booked sessions

**Files to create:**
- `backend/src/services/googleCalendarService.ts`
- `frontend/src/components/CalendarSync.tsx`

**Estimated Time:** 10 hours
**Status:** NOT STARTED

---

### ✅ **7.2 Outlook Calendar Sync** - PRIORITY: LOW
**Objective:** Microsoft Graph API integration

**Similar to Google Calendar**

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

## 📋 PHASE 8: ADMIN FEATURES (Week 5)

### ✅ **8.1 Legal Resources Management** - PRIORITY: MEDIUM
**Objective:** Admin uploads articles

**Backend APIs:**
```
POST   /api/admin/resources/articles
GET    /api/admin/resources/articles
PUT    /api/admin/resources/articles/:id
DELETE /api/admin/resources/articles/:id
GET    /api/resources/articles (public)
```

**Admin UI:**
- Rich text editor
- Image uploads
- Category management
- Published/Draft status

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **8.2 AI Training Data Upload** - PRIORITY: LOW
**Objective:** Upload case law, statutes

**Features:**
- PDF upload
- Text extraction
- Versioning
- Training corpus management

**Estimated Time:** 6 hours
**Status:** NOT STARTED

---

### ✅ **8.3 Analytics Dashboard** - PRIORITY: MEDIUM
**Objective:** Platform metrics

**Metrics:**
- Total bookings
- Revenue (platform commission)
- Lawyer payouts
- Average session duration
- Top lawyers
- Popular times

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

## 📋 PHASE 9: TESTING & REFINEMENT (Week 5-6)

### ✅ **9.1 Unit Tests** - PRIORITY: HIGH
- Backend API tests
- Service function tests
- Frontend component tests

**Estimated Time:** 12 hours
**Status:** NOT STARTED

---

### ✅ **9.2 Integration Tests** - PRIORITY: HIGH
- End-to-end booking flow
- Payment flow
- Wallet operations

**Estimated Time:** 8 hours
**Status:** NOT STARTED

---

### ✅ **9.3 User Acceptance Testing** - PRIORITY: HIGH
- Test with real lawyers
- Test with real clients
- Gather feedback

**Estimated Time:** 16 hours (ongoing)
**Status:** NOT STARTED

---

## 📊 OVERALL TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Foundation | Week 1 | NOT STARTED |
| Phase 2: M-Pesa | Week 2 | NOT STARTED |
| Phase 3: Bookings | Week 2-3 | NOT STARTED |
| Phase 4: Emergency | Week 3 | NOT STARTED |
| Phase 5: Wallet | Week 3-4 | NOT STARTED |
| Phase 6: Notifications | Week 4 | NOT STARTED |
| Phase 7: Calendar | Week 4-5 | NOT STARTED |
| Phase 8: Admin | Week 5 | NOT STARTED |
| Phase 9: Testing | Week 5-6 | NOT STARTED |

**Total Estimated Time:** 6 weeks
**Total Development Hours:** ~210 hours

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Start Phase 1.1** - Emergency contact display (2 hours)
2. **Start Phase 1.2** - Database schema updates (4 hours)
3. **Start Phase 1.3** - Lawyer onboarding enhancement (4 hours)

---

## 📝 NOTES

- M-Pesa sandbox testing required before production
- AfricasTalking account needed for SMS/Voice
- Google Cloud project needed for Calendar API
- SendGrid/AWS SES for emails
- All features tested on staging before production deploy

---

**Last Updated:** November 28, 2025
**Project Status:** PLANNING PHASE
