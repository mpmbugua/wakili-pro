# E2E Testing Guide - Consultation Booking Flow

**Date:** November 28, 2025  
**Test Scope:** Complete consultation booking workflow from lawyer selection to session completion  
**Status:** Ready for manual testing

---

## 🎯 Test Objectives

Verify the complete end-to-end booking flow:
1. ✅ User can browse and select a lawyer
2. ✅ Booking form displays correct information
3. ✅ Available slots are fetched and displayed
4. ✅ M-Pesa payment is initiated successfully
5. ✅ Payment status is tracked in real-time
6. ✅ Booking appears in "My Bookings"
7. ✅ Booking details are accessible
8. ✅ Session can be confirmed after completion
9. ✅ Booking can be cancelled (with policy checks)

---

## 🔧 Pre-Testing Setup

### 1. Environment Check

**Backend (.env):**
```bash
# Verify these are set:
MPESA_CONSUMER_KEY=N9ro1AXVEhD5vJFO5PRLlVYU6z7zINsd4GRtX6Y9XoAdr4YP
MPESA_CONSUMER_SECRET=AaZE6zkQ6LevgbSTNhEU2sv9AiUMuUoBnpCF2p7TimEB2fiA5QdZazm51d2v5WOG
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://wakili-pro.onrender.com/api/payments/mpesa/callback
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:5000/api  # For local testing
# OR
VITE_API_URL=https://wakili-pro.onrender.com/api  # For production testing
```

### 2. Start Services

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
# Should start on http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# Should start on http://localhost:3000
```

### 3. Test Data Preparation

**Create Test Accounts:**
- **Client Account:** Email: `client@test.com`, Password: `Test123!`
- **Lawyer Account:** Email: `lawyer@test.com`, Password: `Test123!`

**Lawyer Setup:**
1. Login as lawyer
2. Complete lawyer onboarding (/lawyer/onboarding)
3. Set hourly rate (e.g., KES 3,000)
4. Configure working hours (e.g., Mon-Fri 9am-5pm)
5. Note the lawyer's user ID from browser console or database

**M-Pesa Test Numbers:**
- Use Safaricom test numbers: `254708374149` or `254712345678`
- PIN for sandbox: `1234` (any 4 digits work in sandbox)

---

## 📋 Test Scenarios

### Scenario 1: Happy Path - Complete Booking Flow

**Steps:**

1. **Browse Lawyers**
   - Navigate to `/lawyers`
   - Expected: List of lawyers displayed
   - Expected: Lawyer cards show hourly rate, specializations, rating
   - Action: Click "Book Consultation" on a lawyer

2. **Booking Form - Select Consultation Type**
   - Expected: BookingForm modal/page opens
   - Expected: Lawyer details displayed (name, rate, profile image)
   - Action: Select consultation type (VIDEO/PHONE/IN_PERSON)
   - Expected: Selected type is highlighted in blue

3. **Booking Form - Select Duration**
   - Action: Select duration (30 min, 1 hr, 1.5 hr, or 2 hr)
   - Expected: Cost updates automatically (rate × duration)
   - Verify: Cost calculation is correct

4. **Booking Form - Select Date**
   - Action: Pick a date (today or future)
   - Expected: Date picker opens
   - Expected: Cannot select past dates
   - Action: Select tomorrow's date

5. **Booking Form - View Available Slots**
   - Expected: AvailableSlots component loads
   - Expected: Loading spinner appears briefly
   - Expected: Time slots appear in grid (2-4 columns)
   - Expected: Only slots within working hours are shown
   - Expected: Past slots for today are excluded
   - Action: Click on an available slot (e.g., 10:00 AM)
   - Expected: Slot is highlighted with blue border

6. **Booking Form - Enter Phone Number**
   - Action: Enter M-Pesa phone number: `254708374149`
   - Expected: Phone input accepts Kenyan format (254, 0, or +254)
   - Verify: Booking summary panel appears with:
     - Date: Tomorrow's date
     - Time: 10:00 AM - 11:00 AM (for 1hr)
     - Type: VIDEO (or selected type)
     - Duration: 60 minutes
     - Total Cost: KES 3,000 (or calculated amount)

7. **Submit Booking & Initiate Payment**
   - Action: Click "Book & Pay KES 3,000"
   - Expected: Button shows "Processing..." with spinner
   - Expected: API call to POST `/api/consultations/create`
   - Expected: Backend creates booking with status `PENDING_PAYMENT`
   - Expected: Backend initiates M-Pesa STK push
   - Expected: Blue info box appears: "Waiting for M-Pesa payment..."
   - Expected: Message: "Check your phone for the M-Pesa prompt"

8. **M-Pesa Payment Simulation**
   - Expected: In sandbox, STK push might not send to phone
   - **Workaround:** Manually update booking status in database:
     ```sql
     UPDATE "ConsultationBooking" 
     SET status = 'PAYMENT_CONFIRMED', 
         "clientPaymentStatus" = 'COMPLETED',
         "mpesaTransactionId" = 'TEST123456',
         "mpesaReceiptNumber" = 'QGX7Y8Z9',
         "clientPaidAt" = NOW()
     WHERE id = 'your-booking-id';
     ```
   - Alternative: Payment polling should timeout after 2 minutes

9. **Payment Success**
   - Expected: After payment status update, polling detects it
   - Expected: Green success box appears: "Payment successful!"
   - Expected: Message: "Your booking has been confirmed. Redirecting..."
   - Expected: Auto-redirect after 2 seconds to bookings page or success page
   - Verify: Booking status changes to `PAYMENT_CONFIRMED`

10. **View My Bookings**
    - Navigate to `/bookings`
    - Expected: Booking appears in list
    - Expected: Status badge shows "PAYMENT CONFIRMED" in blue
    - Expected: "Upcoming" badge displayed
    - Expected: Correct date, time, lawyer name
    - Expected: "✓ Paid" status shown
    - Expected: Cost displayed correctly

11. **View Booking Details**
    - Action: Click "View Details →" or click booking card
    - Navigate to `/bookings/{bookingId}`
    - Expected: Full booking details displayed
    - Expected: Session details section (date, time)
    - Expected: Lawyer information section (name, email, specializations)
    - Expected: M-Pesa transaction details (receipt number, transaction ID)
    - Expected: "Confirm Session Completion" button disabled (session not ended yet)

12. **Session Confirmation (After Session Time)**
    - **Simulate:** Update booking `scheduledEndTime` to past time in database
      ```sql
      UPDATE "ConsultationBooking"
      SET "scheduledEndTime" = NOW() - INTERVAL '1 hour'
      WHERE id = 'your-booking-id';
      ```
    - Refresh booking details page
    - Expected: "Confirm Session Completion" button becomes enabled
    - Action: Click "Confirm Session Completion"
    - Expected: Confirmation alert: "Session confirmed successfully!"
    - Expected: Booking status changes to `COMPLETED`
    - Expected: Green "COMPLETED" badge displayed

---

### Scenario 2: Cancel Booking (Valid Cancellation)

**Steps:**

1. Create a booking scheduled for 48+ hours in the future
2. Navigate to `/bookings/{bookingId}`
3. Expected: "Cancel Booking" button is enabled (red)
4. Action: Click "Cancel Booking"
5. Expected: Modal appears: "Cancel Booking"
6. Expected: Warning text: "Are you sure? This action cannot be undone."
7. Action: Enter optional reason: "Schedule conflict"
8. Action: Click "Confirm Cancel"
9. Expected: "Cancelling..." loading state
10. Expected: Success alert: "Booking cancelled successfully"
11. Expected: Modal closes
12. Expected: Booking status changes to `CANCELLED`
13. Expected: Red "CANCELLED" badge displayed
14. Expected: Action buttons are disabled

**Verify:**
- ✅ Refund logic (TODO: Phase 2.2)
- ✅ Notification sent (TODO: Phase 6)

---

### Scenario 3: Cancel Booking (Policy Violation)

**Steps:**

1. Create a booking scheduled for 12 hours from now
2. Navigate to `/bookings/{bookingId}`
3. Expected: Yellow warning box: "Cancellation is only allowed 24+ hours before..."
4. Expected: "Cancel Booking" button is disabled
5. Action: Try clicking cancel button
6. Expected: No modal appears (button disabled)

**Verify:**
- ✅ 24-hour policy enforced
- ✅ User informed of policy

---

### Scenario 4: Role-Based Views (Client vs Lawyer)

**Client View:**

1. Login as client
2. Navigate to `/bookings`
3. Action: Toggle to "View As: Client"
4. Expected: Shows bookings where user is the client
5. Expected: Lawyer details displayed (name, specializations)
6. Expected: No payment breakdown shown

**Lawyer View:**

1. Login as lawyer
2. Navigate to `/bookings`
3. Action: Toggle to "View As: Lawyer"
4. Expected: Shows bookings where user is the lawyer
5. Expected: Client details displayed
6. Navigate to a booking details page
7. Expected: Payment breakdown section visible:
   - Client Payment: KES 3,000
   - Platform Commission (10%): - KES 300
   - Your Payout: KES 2,700
8. Expected: Confirm completion button available (after session ends)

---

### Scenario 5: Filter and Search Bookings

**Steps:**

1. Create multiple test bookings with different statuses:
   - Booking 1: PENDING_PAYMENT
   - Booking 2: PAYMENT_CONFIRMED (upcoming)
   - Booking 3: COMPLETED (past)
   - Booking 4: CANCELLED

2. Navigate to `/bookings`

3. **Filter by Status:**
   - Action: Select "Pending Payment"
   - Expected: Only Booking 1 shown
   - Action: Select "Completed"
   - Expected: Only Booking 3 shown
   - Action: Select "All Statuses"
   - Expected: All 4 bookings shown

4. **Filter by Time Range:**
   - Action: Check "Show upcoming only"
   - Expected: Only Bookings 1 & 2 shown (future dates)
   - Action: Uncheck "Show upcoming only"
   - Expected: All bookings shown (including past)

---

### Scenario 6: Error Handling

**Test Case 6.1: Invalid Phone Number**
- Enter phone: `123456`
- Action: Click "Book & Pay"
- Expected: Red error box: "Please enter a valid Kenyan phone number"

**Test Case 6.2: No Slot Selected**
- Skip slot selection
- Action: Click "Book & Pay"
- Expected: Red error box: "Please select a time slot"

**Test Case 6.3: Backend Error**
- Stop backend server
- Action: Try to create booking
- Expected: Error message: "Failed to create booking. Please try again."

**Test Case 6.4: Payment Timeout**
- Create booking but don't complete M-Pesa payment
- Wait 2 minutes
- Expected: Payment status changes to "failed"
- Expected: Red error box: "Payment timeout. Please check your phone..."

---

## 🔍 Testing Checklist

### Functional Tests

- [ ] **Booking Creation**
  - [ ] Form displays lawyer details correctly
  - [ ] Consultation type selection works
  - [ ] Duration picker updates cost
  - [ ] Date picker restricts past dates
  - [ ] Available slots load and display
  - [ ] Slot selection highlights selected slot
  - [ ] Phone validation works (Kenyan format)
  - [ ] Booking summary shows correct info
  - [ ] Submit button initiates booking + payment

- [ ] **Payment Flow**
  - [ ] M-Pesa STK push initiated
  - [ ] Payment status polling starts
  - [ ] Success state displays after payment
  - [ ] Auto-redirect works
  - [ ] Booking status updates to PAYMENT_CONFIRMED

- [ ] **My Bookings List**
  - [ ] Bookings load correctly
  - [ ] Role toggle (Client/Lawyer) works
  - [ ] Status filter works
  - [ ] Upcoming filter works
  - [ ] Booking cards display correct info
  - [ ] Click navigates to details page

- [ ] **Booking Details**
  - [ ] Full details displayed
  - [ ] Session info correct (date, time)
  - [ ] Participant info correct
  - [ ] Payment breakdown (for lawyers)
  - [ ] Transaction details shown
  - [ ] Confirm button enabled after session ends
  - [ ] Confirmation updates status
  - [ ] Cancel button works (with policy)
  - [ ] Cancel modal functions properly

- [ ] **Authorization**
  - [ ] Protected routes require login
  - [ ] Only booking participants can view details
  - [ ] Only client can reschedule (future feature)
  - [ ] Both parties can confirm completion

### UI/UX Tests

- [ ] **Responsive Design**
  - [ ] Mobile view (< 768px) works
  - [ ] Tablet view (768-1024px) works
  - [ ] Desktop view (> 1024px) works
  - [ ] Slot grid adjusts columns (2-4)
  - [ ] Forms are usable on mobile

- [ ] **Loading States**
  - [ ] Spinner shows while fetching slots
  - [ ] "Processing..." on submit button
  - [ ] "Loading bookings..." on list page
  - [ ] Skeleton loaders (if implemented)

- [ ] **Error States**
  - [ ] Error messages display clearly
  - [ ] Red alert boxes for errors
  - [ ] Error icons present
  - [ ] Form validation errors inline

- [ ] **Success States**
  - [ ] Green success boxes
  - [ ] Checkmark icons
  - [ ] Success messages clear
  - [ ] Auto-dismiss or auto-redirect

### Performance Tests

- [ ] **API Response Times**
  - [ ] Slot fetching < 2 seconds
  - [ ] Booking creation < 3 seconds
  - [ ] My bookings list < 2 seconds
  - [ ] Booking details < 1 second

- [ ] **Payment Polling**
  - [ ] Polls every 3 seconds
  - [ ] Max 40 attempts (2 minutes)
  - [ ] Stops on success/failure
  - [ ] No memory leaks

### Integration Tests

- [ ] **Backend API Integration**
  - [ ] GET /api/lawyers/:id/available-slots
  - [ ] POST /api/consultations/create
  - [ ] GET /api/consultations/my-bookings
  - [ ] GET /api/consultations/:id
  - [ ] PATCH /api/consultations/:id/confirm
  - [ ] PATCH /api/consultations/:id/cancel

- [ ] **M-Pesa Integration**
  - [ ] STK push initiated correctly
  - [ ] Callback handling (if testable)
  - [ ] Payment status updates
  - [ ] Transaction ID stored

---

## 🐛 Known Issues / Limitations

1. **M-Pesa Sandbox:**
   - STK push may not deliver to phone in sandbox mode
   - May need to manually update payment status in database
   - Callback URL must be publicly accessible

2. **Payment Polling:**
   - 2-minute timeout may be too short for real users
   - Consider increasing to 5 minutes in production

3. **Session Time Validation:**
   - Currently checks if `scheduledEndTime` has passed
   - Should validate actual session occurred (future enhancement)

4. **Reschedule Feature:**
   - Backend API exists but frontend UI not yet implemented
   - TODO: Add reschedule modal in BookingDetails

5. **Review System:**
   - Not yet implemented (Phase 3.3)
   - Should prompt client after session confirmation

---

## 📊 Test Data Templates

### Booking Test Cases

```javascript
// Test Case 1: Standard 1-hour video consultation
{
  consultationType: 'VIDEO',
  duration: 60,
  scheduledDate: 'Tomorrow 10:00 AM',
  phoneNumber: '254708374149',
  expectedCost: 3000 // lawyer hourly rate
}

// Test Case 2: 2-hour phone consultation
{
  consultationType: 'PHONE',
  duration: 120,
  scheduledDate: 'Tomorrow 2:00 PM',
  phoneNumber: '254712345678',
  expectedCost: 6000 // 2 × hourly rate
}

// Test Case 3: 30-min in-person meeting
{
  consultationType: 'IN_PERSON',
  duration: 30,
  scheduledDate: 'Next week Monday 9:00 AM',
  phoneNumber: '0708374149',
  expectedCost: 1500 // 0.5 × hourly rate
}
```

### Database Queries for Testing

```sql
-- Check booking status
SELECT id, status, "clientPaymentStatus", "scheduledStartTime", "scheduledEndTime"
FROM "ConsultationBooking"
WHERE "clientId" = 'your-user-id'
ORDER BY "createdAt" DESC;

-- Simulate payment success
UPDATE "ConsultationBooking"
SET status = 'PAYMENT_CONFIRMED',
    "clientPaymentStatus" = 'COMPLETED',
    "mpesaTransactionId" = 'TEST' || (FLOOR(RANDOM() * 1000000)::TEXT),
    "mpesaReceiptNumber" = 'QGX' || (FLOOR(RANDOM() * 100000)::TEXT),
    "clientPaidAt" = NOW()
WHERE id = 'booking-id-here';

-- Simulate session ended (for confirmation testing)
UPDATE "ConsultationBooking"
SET "scheduledEndTime" = NOW() - INTERVAL '1 hour'
WHERE id = 'booking-id-here';

-- Simulate far-future booking (for cancellation testing)
UPDATE "ConsultationBooking"
SET "scheduledStartTime" = NOW() + INTERVAL '3 days',
    "scheduledEndTime" = NOW() + INTERVAL '3 days 1 hour'
WHERE id = 'booking-id-here';

-- View all booking details
SELECT 
  b.id,
  b.status,
  b."clientPaymentStatus",
  b."scheduledStartTime",
  b."scheduledEndTime",
  b."clientPaymentAmount",
  c."firstName" || ' ' || c."lastName" AS client_name,
  l."firstName" || ' ' || l."lastName" AS lawyer_name
FROM "ConsultationBooking" b
JOIN "User" c ON b."clientId" = c.id
JOIN "User" l ON b."lawyerId" = l.id
ORDER BY b."createdAt" DESC;
```

---

## ✅ Success Criteria

**Phase 3.2 is considered successfully tested when:**

1. ✅ User can complete entire booking flow without errors
2. ✅ Payment integration works (at least in sandbox)
3. ✅ Bookings appear correctly in "My Bookings"
4. ✅ Booking details are accurate and complete
5. ✅ Session confirmation works after time passes
6. ✅ Cancellation policy is enforced correctly
7. ✅ Role-based views work (client vs lawyer)
8. ✅ All filters and sorting work correctly
9. ✅ UI is responsive on mobile/tablet/desktop
10. ✅ No console errors in browser dev tools
11. ✅ No TypeScript compilation errors
12. ✅ Backend APIs return expected responses

---

## 📝 Test Report Template

```markdown
# E2E Test Report - Consultation Booking

**Tester:** [Your Name]
**Date:** November 28, 2025
**Environment:** Local / Production
**Backend URL:** http://localhost:5000 / https://wakili-pro.onrender.com
**Frontend URL:** http://localhost:3000 / https://wakili-pro-frontend.vercel.app

## Test Results

| Scenario | Status | Notes |
|----------|--------|-------|
| Happy Path Booking | ✅ PASS | Payment required manual DB update |
| Cancel Valid | ✅ PASS | |
| Cancel Policy Block | ✅ PASS | |
| Client View | ✅ PASS | |
| Lawyer View | ✅ PASS | |
| Filter Bookings | ✅ PASS | |
| Error Handling | ⚠️ PARTIAL | Timeout message could be clearer |

## Issues Found

1. **Issue:** M-Pesa STK push not delivering in sandbox
   - **Severity:** Medium
   - **Workaround:** Manual DB update
   - **Fix Required:** Production M-Pesa credentials needed

2. **Issue:** Payment polling timeout message unclear
   - **Severity:** Low
   - **Recommendation:** Improve UX message

## Recommendations

1. Increase payment polling timeout to 5 minutes
2. Add manual payment retry button
3. Implement reschedule UI
4. Add loading skeleton for booking cards
5. Add toast notifications for actions

## Overall Status

✅ **READY FOR PRODUCTION** (with M-Pesa production credentials)

```

---

## 🚀 Next Steps After Testing

1. **Document Issues** - Log any bugs found in GitHub Issues
2. **Performance Tuning** - Optimize slow API calls
3. **Production Deployment:**
   - Update M-Pesa credentials to production
   - Test with real money (KES 1 test transaction)
   - Register callback URLs with Safaricom
4. **Phase 3.3** - Implement dual confirmation & review system
5. **Phase 2.2** - Complete escrow/refund logic

---

**Happy Testing! 🎉**
