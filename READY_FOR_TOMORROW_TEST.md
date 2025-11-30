# ✅ Ready for Tomorrow's Production Test

## 🎯 What We're Testing

**Complete document certification workflow:**
1. Client uploads document
2. Client pays (M-Pesa or manual complete)
3. AI reviews document (if selected)
4. Lawyer gets assigned automatically
5. Lawyer certifies with signature + stamp
6. Client downloads certified document + certificate
7. Anyone verifies certificate via QR code

---

## 🏗️ Infrastructure Status

### ✅ COMPLETE - Backend Services

| Service | File | Status | Notes |
|---------|------|--------|-------|
| Payment Processing | `documentPayment.ts` | ✅ | M-Pesa + Flutterwave webhooks |
| Manual Payment | `payments.ts` | ✅ | Testing endpoint ready |
| AI Document Review | `documentAIReview.ts` | ✅ | OpenAI GPT-4 integration |
| Lawyer Assignment | `lawyerAssignmentService.ts` | ✅ | Smart matching algorithm |
| PDF Signing | `pdfSigningService.ts` | ✅ | Signature + stamp application |
| Certificate Generation | `pdfSigningService.ts` | ✅ | QR code + professional design |
| Email Notifications | `documentNotificationService.ts` | ✅ | Client + lawyer emails |
| SMS Notifications | `documentNotificationService.ts` | ✅ | Assignment alerts |
| Certificate Verification | `documentCertificationController.ts` | ✅ | Public verification endpoint |

### ✅ COMPLETE - Frontend Pages

| Page | Route | Status | Purpose |
|------|-------|--------|---------|
| Document Upload | `/dashboard/documents/upload` | ✅ | Client uploads documents |
| Payment Page | `/payment` | ✅ | M-Pesa payment flow |
| Client Dashboard | `/dashboard/documents` | ✅ | View review status |
| Lawyer Certification | `/lawyer/certifications` | ✅ | Lawyer certification queue |
| Signature Setup | `/lawyer/signature-setup` | ✅ | Upload signature + stamp |
| Certificate Verify | `/verify/:certificateId` | ✅ | Public QR verification |

### ✅ COMPLETE - API Endpoints

```
Payment:
POST /api/document-payment/initiate
POST /api/document-payment/mpesa-callback
POST /api/document-payment/flutterwave-webhook
GET  /api/document-payment/:paymentId/status
POST /api/payments/:paymentId/manual-complete ⚡ (Testing)

Certification:
POST /api/certification/certify
GET  /api/certification/queue
GET  /api/certification/verify/:certificateId

Letterhead:
POST /api/lawyer/letterhead
POST /api/lawyer/letterhead/signature
POST /api/lawyer/letterhead/stamp
GET  /api/lawyer/letterhead

Reviews:
GET  /api/document-reviews
GET  /api/document-reviews/:id
```

---

## 👥 Test Accounts

### Client Account
```
Email: mpmbugua.peter@gmail.com
Phone: 254712345678
Role: CLIENT
```

### Lawyer Account
```
Email: lucy.advocate@wakili-pro.com
Name: Advocate Lucy Chepkemoi
License: LSK/12345
Tier: PRO (unlimited certifications)
Role: LAWYER
```

**Lawyer must complete signature setup before certifying:**
- Navigate to `/lawyer/signature-setup`
- Upload digital signature image (PNG)
- Upload official stamp/seal image (PNG)
- Fill firm details

---

## 🧪 Testing Script

### Phase 1: Lawyer Setup (One-Time)

```bash
1. Login to https://wakili-pro-1.onrender.com
   Email: lucy.advocate@wakili-pro.com
   Password: [your password]

2. Navigate to: /lawyer/signature-setup

3. Upload Files:
   - Signature: PNG image with transparent background
   - Stamp: PNG image of official seal
   
4. Fill Details:
   Firm Name: Lucy & Associates Advocates
   Address: Westlands, Nairobi
   Phone: +254700123456
   Email: info@lucyadvocates.co.ke
   License: LSK/12345
   Certificate Prefix: WP
   
5. Save Changes

6. [ADMIN ACTION] Approve letterhead
```

### Phase 2: Client Document Upload

```bash
1. Login to https://wakili-pro-1.onrender.com
   Email: mpmbugua.peter@gmail.com
   Password: [your password]

2. Navigate to: /dashboard/documents/upload

3. Upload Document:
   - File: Any PDF (Contract, Agreement, etc.)
   - Service: "AI Review + Certification" (KES 1,800)
   - Urgency: "Standard" (48 hours)
   
4. Click: "Proceed to Payment"
```

### Phase 3: Payment

**Option A: Real M-Pesa Payment**
```bash
1. Payment page shows amount: KES 1,800
2. Phone already filled: 254712345678
3. Click: "Pay with M-Pesa"
4. Check phone for STK Push notification
5. Enter M-Pesa PIN
6. Wait for confirmation (5-30 seconds)
7. Redirected to dashboard
```

**Option B: Manual Payment (Testing)**
```bash
# After payment initiated, get payment ID from:
# - Browser network tab (check initiate response)
# - Backend logs
# - Database query

# Then trigger manual complete:
curl -X POST https://wakili-pro.onrender.com/api/payments/{PAYMENT_ID}/manual-complete \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Payment marked as paid and workflow triggered",
  "payment": {
    "id": "...",
    "status": "PAID",
    "verifiedAt": "2024-01-15T..."
  }
}
```

### Phase 4: Verify Workflow Triggered

**Check Backend Logs:**
```bash
# Should see in Render logs:
[DocumentPayment] Payment verified: {paymentId}
[DocumentPayment] Creating document review request
[DocumentPayment] AI review started for review: {reviewId}
[DocumentAI] Extracting text from PDF...
[DocumentAI] Sending to OpenAI for analysis...
[DocumentAI] Review complete - Score: 85/100
[LawyerAssignment] Assigning lawyer to review: {reviewId}
[LawyerAssignment] Lawyer assigned successfully
[Notification] Email sent to: mpmbugua.peter@gmail.com
[Notification] Email sent to: lucy.advocate@wakili-pro.com
```

**Check Database:**
```sql
-- Payment should be PAID
SELECT id, status, verifiedAt FROM Payment WHERE id = '{paymentId}';

-- Review should be assigned
SELECT id, status, lawyerId, assignedAt 
FROM DocumentReview 
WHERE id = '{reviewId}';
```

**Check Email:**
```
Client Email (mpmbugua.peter@gmail.com):
Subject: 👨‍⚖️ Lawyer Assigned - Advocate Lucy will review "..."

Lawyer Email (lucy.advocate@wakili-pro.com):
Subject: 📄 New Document Assignment - "..."
```

### Phase 5: Lawyer Certification

```bash
1. Login as: lucy.advocate@wakili-pro.com

2. Navigate to: /lawyer/certifications

3. Should see document in queue:
   - Document name
   - Client: Peter Mbugua
   - Urgency badge
   - Deadline

4. Click: "View Document" (opens PDF in new tab)

5. Review document contents

6. Back to certification page

7. Optional: Add notes
   "Document reviewed and verified for legal compliance. 
    All clauses are properly structured."

8. Click: "Certify Document"

9. Wait for processing (10-30 seconds)

10. Success message with Certificate ID:
    "Document certified successfully! Certificate ID: WP-..."
```

**Backend Processing:**
```bash
# Logs should show:
[Certification] Certifying document: {reviewId}
[Certification] Verifying lawyer letterhead setup
[PDFSigning] Downloading original PDF from Cloudinary
[PDFSigning] Applying signature and stamp
[PDFSigning] Generating QR code
[PDFSigning] Uploading signed PDF to Cloudinary
[Certificate] Generating Certificate of Authenticity
[Certificate] Uploading certificate PDF to Cloudinary
[Certification] Updating review status to completed
[Notification] Sending completion email to client
```

### Phase 6: Client Downloads

**Check Email:**
```
To: mpmbugua.peter@gmail.com
Subject: 🎉 Certificate Ready! "..." - ID: WP-...

Email contains:
- Certificate details
- Download link for certified document
- Download link for Certificate of Authenticity
- Verification URL
```

**Dashboard:**
```bash
1. Login as: mpmbugua.peter@gmail.com
2. Navigate to: /dashboard/documents
3. Should see completed review:
   - Status: COMPLETED
   - AI Score: 85/100
   - Certified by: Advocate Lucy
   - Certificate ID: WP-...
   
4. Click: "Download Certified Document"
   - Should download PDF with signature + stamp
   
5. Click: "Download Certificate"
   - Should download Certificate of Authenticity PDF
   
6. Verify signature and stamp appear on last page
7. Verify QR code present
```

### Phase 7: Verify Certificate

**Scan QR Code:**
```bash
# QR code encodes: https://wakili-pro.com/verify/WP-...
# Scan with phone or navigate manually

1. Open: https://wakili-pro-1.onrender.com/verify/WP-{certificateId}

2. Should display:
   ✅ Certificate Valid
   
   Certificate ID: WP-...
   Document: [Document Name]
   Certified by: Advocate Lucy Chepkemoi
   License: LSK/12345
   Firm: Lucy & Associates Advocates
   Date: January 15, 2024
   
   [View Certified Document] [View Certificate]
```

---

## 🔍 Verification Checklist

### Pre-Test Verification

- [ ] Lawyer has completed signature setup
- [ ] Lawyer signature image uploaded to Cloudinary
- [ ] Lawyer stamp image uploaded to Cloudinary
- [ ] Admin approved lawyer letterhead
- [ ] Client account has valid email
- [ ] Client account has valid phone number
- [ ] Test document PDF prepared

### During Test Verification

- [ ] Payment initiated successfully
- [ ] STK Push received on phone (M-Pesa) OR manual complete works
- [ ] Payment status updated to PAID
- [ ] AI review triggered (if selected)
- [ ] AI review completed with scores
- [ ] Lawyer assignment triggered
- [ ] Lawyer assigned successfully
- [ ] Client email received (lawyer assigned)
- [ ] Lawyer email received (new assignment)
- [ ] Document appears in lawyer certification queue
- [ ] Lawyer can view document PDF
- [ ] Certification process completes
- [ ] Signed PDF generated with signature + stamp
- [ ] Certificate PDF generated with QR code
- [ ] Client email received (certification complete)
- [ ] Client can download certified document
- [ ] Client can download certificate
- [ ] Signature appears on PDF
- [ ] Stamp appears on PDF
- [ ] QR code appears on both PDFs
- [ ] Verification page loads
- [ ] Certificate validation works
- [ ] Download links work from verification page

---

## 🐛 Known Issues & Workarounds

### Issue 1: Payment stuck in PENDING

**Symptom:** Payment initiated but never updates to PAID

**Debug:**
```bash
# Check webhook endpoint accessible:
curl https://wakili-pro.onrender.com/api/document-payment/mpesa-callback

# Check payment record:
SELECT * FROM Payment WHERE id = '{paymentId}';
```

**Workaround:**
```bash
# Use manual complete endpoint:
POST /api/payments/{paymentId}/manual-complete
```

### Issue 2: Lawyer not assigned

**Symptom:** Review status stays "pending_lawyer_assignment"

**Debug:**
```sql
-- Check eligible lawyers:
SELECT id, email, isVerified, role, acceptingReviews 
FROM User WHERE role = 'LAWYER';

-- Check lawyer profiles:
SELECT userId, tier, monthlyCertifications, maxCertificationsPerMonth
FROM LawyerProfile WHERE isVerified = true;
```

**Fix:**
```sql
-- Manually assign lawyer:
UPDATE DocumentReview 
SET lawyerId = '{lucyUserId}', 
    status = 'assigned',
    assignedAt = NOW()
WHERE id = '{reviewId}';
```

### Issue 3: Certification fails - Missing letterhead

**Symptom:** "Please complete signature and stamp setup first"

**Debug:**
```sql
SELECT * FROM LawyerLetterhead WHERE lawyerId = '{lucyUserId}';
```

**Fix:**
1. Lawyer completes signature setup
2. Admin approves letterhead:
```sql
UPDATE LawyerLetterhead 
SET isApproved = true, 
    approvedAt = NOW()
WHERE lawyerId = '{lucyUserId}';
```

### Issue 4: PDFs not uploading to Cloudinary

**Symptom:** Cloudinary upload fails

**Debug:**
```bash
# Check environment variables:
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Workaround:**
```bash
# Check Cloudinary dashboard
# Verify API credentials
# Check upload quota not exceeded
```

---

## 📊 Success Metrics

**Complete workflow should take:**
- Payment → Lawyer Assignment: **< 1 minute**
- Lawyer Certification: **Manual (variable)**
- Client Notification: **< 30 seconds after certification**

**All these should work:**
- ✅ Real M-Pesa payment OR manual payment complete
- ✅ AI review generates scores and findings
- ✅ Lawyer auto-assignment
- ✅ Email notifications (client + lawyer)
- ✅ SMS notifications (optional)
- ✅ Lawyer certification
- ✅ PDF signature + stamp application
- ✅ Certificate generation with QR code
- ✅ Client downloads (certified doc + certificate)
- ✅ QR code verification
- ✅ Public verification page

---

## 🎬 Quick Reference

### URLs

```
Production Frontend: https://wakili-pro-1.onrender.com
Production Backend:  https://wakili-pro.onrender.com/api

Document Upload:     /dashboard/documents/upload
Payment:             /payment
Client Dashboard:    /dashboard/documents
Lawyer Queue:        /lawyer/certifications
Signature Setup:     /lawyer/signature-setup
Verify Certificate:  /verify/:certificateId
```

### Credentials

```
Client: mpmbugua.peter@gmail.com
Lawyer: lucy.advocate@wakili-pro.com
```

### Test Payment ID

```bash
# After payment initiated, capture from response:
{
  "paymentId": "clr...",  # Copy this
  "checkoutRequestId": "ws_CO_..."
}

# Then if needed:
curl -X POST https://wakili-pro.onrender.com/api/payments/{paymentId}/manual-complete
```

### Certificate ID Format

```
WP-1705320600000
└─┬─┘ └────┬────┘
  │        └─ Unix timestamp
  └─ Certificate prefix (from lawyer letterhead)
```

---

## 📝 Tomorrow's Agenda

**Morning:**
1. ✅ Verify lawyer signature setup complete
2. ✅ Prepare test PDF document
3. ✅ Test M-Pesa payment (or use manual complete)
4. ✅ Verify workflow triggers correctly

**Afternoon:**
1. ✅ Lawyer certifies document
2. ✅ Client downloads certified documents
3. ✅ Test QR verification
4. ✅ Document any issues
5. ✅ Create production deployment checklist

**End of Day:**
- [ ] Complete workflow documentation updated
- [ ] Any bugs logged and prioritized
- [ ] Screenshots/videos of working flow
- [ ] Ready for production rollout

---

**Status:** ✅ **ALL INFRASTRUCTURE COMPLETE**  
**Ready for Testing:** ✅ **YES - Tomorrow**  
**Deployment:** ✅ **Production (Render)**

**Last Updated:** January 15, 2024, 11:30 PM  
**Next Test:** January 16, 2024 (Tomorrow)
