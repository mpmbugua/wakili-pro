# 📋 Complete Document Certification Workflow

## 🎯 Overview
End-to-end workflow for document review, certification, and stamping with lawyer assignment, digital signatures, and QR verification.

---

## 🔄 Complete Workflow (Step-by-Step)

### **Phase 1: Client Upload & Payment**

#### Step 1: Client Uploads Document
**Frontend:** `DocumentUploadPage.tsx` or `DocumentServicesPage.tsx`

1. Client selects service type:
   - **AI Review Only** (KES 500)
   - **Certification Only** (KES 1,500)
   - **AI Review + Certification** (KES 1,800)

2. Client chooses urgency:
   - **Standard** (48 hours)
   - **Urgent** (24 hours) +50%
   - **Emergency** (6 hours) +100%

3. Document uploaded to Cloudinary
4. `DocumentReview` record created with status: `pending_payment`

#### Step 2: Payment Processing
**Frontend:** `PaymentPage.tsx`  
**Backend:** `POST /api/document-payment/initiate`

**M-Pesa Flow:**
```
1. Client enters phone number (254712345678)
2. STK Push sent to phone
3. Client enters M-Pesa PIN
4. M-Pesa webhook callback: POST /api/document-payment/mpesa-callback
5. Payment verified and status updated to PAID
6. DocumentReview status → pending_lawyer_assignment
```

**Card Payment Flow:**
```
1. Client enters card details
2. Flutterwave processes payment
3. Webhook callback: POST /api/document-payment/flutterwave-webhook
4. Payment verified and status updated to PAID
5. DocumentReview status → pending_lawyer_assignment
```

**Database Updates:**
```sql
-- Payment record created
INSERT INTO Payment (
  userId, amount, currency, status,
  paymentMethod, provider, metadata
) VALUES (...)

-- DocumentReview updated
UPDATE DocumentReview
SET status = 'pending_lawyer_assignment',
    paidAt = NOW()
WHERE id = reviewId
```

---

### **Phase 2: AI Review (If Selected)**

**Backend:** `reviewDocumentWithAI()` in `documentAIReview.ts`

Triggered automatically after payment success if service type includes AI review.

**Process:**
1. Extract text from PDF using pdf-parse
2. Send to OpenAI GPT-4 for analysis
3. AI analyzes:
   - Legal compliance
   - Missing clauses
   - Risk assessment
   - Recommendations
4. Generate review report with scores (0-100)
5. Save to `reviewResults` JSON field
6. Status → `pending_lawyer_assignment` (if certification also selected)

**Review Results Structure:**
```typescript
{
  overallScore: 85,
  legalCompliance: 90,
  clarity: 80,
  completeness: 85,
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  findings: [
    {
      severity: "HIGH" | "MEDIUM" | "LOW",
      category: "Missing Clause" | "Ambiguous" | "Risk",
      description: "...",
      recommendation: "..."
    }
  ],
  summary: "...",
  aiModel: "gpt-4",
  reviewedAt: "2024-01-15T10:30:00Z"
}
```

---

### **Phase 3: Lawyer Assignment**

**Backend:** `assignLawyerToDocumentReview()` in `lawyerAssignmentService.ts`

Triggered automatically after:
- Payment success (for Certification Only)
- AI review completion (for AI + Certification)

#### Smart Assignment Algorithm

**Step 1: Find Eligible Lawyers**
```sql
SELECT * FROM LawyerProfile
WHERE isVerified = true
  AND role = 'LAWYER'
  AND acceptingReviews = true
  AND tier IN ('LITE', 'PRO')
ORDER BY
  rating DESC,
  totalReviews DESC,
  activeReviews ASC
```

**Step 2: Check Lawyer Limits**
```typescript
// FREE tier: Max 2 total certifications (lifetime)
// LITE tier: Max 5 certifications/month, 2/day
// PRO tier: Unlimited certifications, 10/day

// Skip lawyers at capacity
if (tier === 'FREE' && totalCertifications >= 2) continue;
if (tier === 'LITE' && monthlyCertifications >= 5) continue;
if (dailyCertifications >= maxPerDay) continue;
```

**Step 3: Assign Best Match**
```typescript
// Select lawyer with:
// - Highest rating
// - Most completed reviews
// - Lowest active workload

const assignedLawyer = eligibleLawyers[0];

await prisma.documentReview.update({
  where: { id: reviewId },
  data: {
    lawyerId: assignedLawyer.id,
    status: 'assigned',
    assignedAt: new Date(),
    estimatedDeliveryDate: calculateDeliveryDate(urgency)
  }
});
```

#### Notifications Sent

**To Client (Email):**
```
Subject: 👨‍⚖️ Lawyer Assigned - [Lawyer Name] will review "[Document Title]"

Hi [Client Name],

Great news! Your document has been assigned to a qualified lawyer.

Lawyer Details:
• Name: Advocate [Lawyer Name]
• License: LSK/[Number]
• Specialization: [Areas]
• Rating: ⭐ 4.8/5.0

Estimated Delivery: [Date]

Track progress: https://wakili-pro.com/dashboard/documents
```

**To Client (SMS):**
```
Wakili Pro: Advocate [Lawyer Name] assigned to your document "[Title]". 
Estimated delivery: [Date]. Track: wakili-pro.com/dashboard
```

**To Lawyer (Email):**
```
Subject: 📄 New Document Assignment - "[Document Title]"

Hi Advocate [Name],

You have been assigned a new document for review.

Document: [Title]
Client: [Client Name]
Urgency: [STANDARD/URGENT/EMERGENCY]
Deadline: [Date]

Your tasks:
1. Review the document for legal compliance
2. Apply your digital signature and stamp
3. Generate Certificate of Authenticity

Review Now: https://wakili-pro.com/lawyer/certifications
```

**To Lawyer (SMS):**
```
Wakili Pro: New URGENT document assigned - "[Title]". 
Deadline: [Date]. Review: wakili-pro.com/lawyer/certifications
```

---

### **Phase 4: Lawyer Review & Certification**

**Frontend:** `DocumentCertificationPage.tsx` (`/lawyer/certifications`)

#### Lawyer Dashboard Features

**Certification Queue Display:**
```typescript
interface PendingCertification {
  id: string;
  documentName: string;
  reviewType: 'AI_REVIEW' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION';
  clientName: string;
  submittedAt: string;
  deadline: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  documentUrl: string; // Cloudinary URL
}
```

**Queue Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Contract Agreement Review                          HIGH  │
│ Corporate Law                                               │
│                                                             │
│ 👤 Peter Mbugua          📅 Due: Jan 16, 2024             │
│                                                             │
│ [View Document]              [Review & Certify]            │
└─────────────────────────────────────────────────────────────┘
```

#### Certification Process

**Step 1: Lawyer Reviews Document**
```typescript
// Lawyer clicks "View Document"
// PDF opens in new tab from Cloudinary
<a href={`${API_URL}${doc.documentUrl}`} target="_blank">
  View Document
</a>
```

**Step 2: Lawyer Adds Notes (Optional)**
```typescript
// Certification panel
<textarea 
  placeholder="Add certification notes..."
  value={notes[documentId]}
/>
```

**Step 3: Lawyer Clicks "Certify Document"**

**Frontend Request:**
```typescript
POST /api/certification/certify
Headers: { Authorization: Bearer <token> }
Body: {
  reviewId: "review-uuid",
  notes: "Document reviewed and verified for legal compliance."
}
```

**Backend Processing:** `documentCertificationController.ts`

```typescript
export async function certifyDocument(req, res) {
  const { reviewId, notes } = req.body;
  const lawyerId = req.user.id;

  // 1. Verify lawyer role
  if (req.user.role !== 'LAWYER') {
    throw new Error('Only lawyers can certify documents');
  }

  // 2. Check letterhead setup
  const letterhead = await prisma.lawyerLetterhead.findUnique({
    where: { lawyerId }
  });

  if (!letterhead?.signatureUrl || !letterhead?.stampUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please complete signature and stamp setup first'
    });
  }

  // 3. Get document review
  const review = await prisma.documentReview.findUnique({
    where: { id: reviewId },
    include: { userDocument: true, user: true }
  });

  // 4. Generate certificate ID
  const certificateId = `${letterhead.certificatePrefix || 'WP'}-${Date.now()}`;

  // 5. Apply signature and stamp to PDF
  const signedDocumentUrl = await pdfSigningService.signDocument({
    documentUrl: review.userDocument.fileUrl,
    signatureUrl: letterhead.signatureUrl,
    stampUrl: letterhead.stampUrl,
    lawyerName: `${req.user.firstName} ${req.user.lastName}`,
    licenseNumber: letterhead.licenseNumber,
    firmName: letterhead.firmName,
    certificateId,
    certificationDate: new Date()
  });

  // 6. Generate Certificate of Authenticity
  const certificateUrl = await pdfSigningService.generateCertificate({
    documentTitle: review.userDocument.title,
    certificateId,
    lawyerName: `${req.user.firstName} ${req.user.lastName}`,
    licenseNumber: letterhead.licenseNumber,
    firmName: letterhead.firmName,
    firmAddress: letterhead.firmAddress,
    certificationDate: new Date(),
    qrCodeData: `https://wakili-pro.com/verify/${certificateId}`
  });

  // 7. Update review status
  await prisma.documentReview.update({
    where: { id: reviewId },
    data: {
      status: 'completed',
      certifiedAt: new Date(),
      certificationNotes: notes,
      certificateId,
      certifiedDocumentUrl: signedDocumentUrl,
      certificateUrl
    }
  });

  // 8. Send notifications
  await sendCertificationCompleteEmail(
    review.user.email,
    `${review.user.firstName} ${review.user.lastName}`,
    review.userDocument.title,
    signedDocumentUrl,
    certificateUrl,
    certificateId
  );

  // 9. Update lawyer metrics
  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: {
      monthlyCertifications: { increment: 1 },
      totalCertifications: { increment: 1 }
    }
  });

  return res.json({
    success: true,
    message: 'Document certified successfully',
    data: {
      certificateId,
      certifiedDocumentUrl: signedDocumentUrl,
      certificateUrl
    }
  });
}
```

---

### **Phase 5: PDF Signing & Certificate Generation**

**Backend:** `pdfSigningService.ts`

#### Apply Signature & Stamp to PDF

```typescript
async signDocument(options: {
  documentUrl: string;
  signatureUrl: string;
  stampUrl: string;
  lawyerName: string;
  licenseNumber: string;
  firmName: string;
  certificateId: string;
  certificationDate: Date;
}): Promise<string> {
  
  // 1. Download original PDF from Cloudinary
  const pdfBuffer = await downloadFromCloudinary(documentUrl);
  
  // 2. Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  
  // 3. Download signature and stamp images
  const signatureImage = await downloadImage(signatureUrl);
  const stampImage = await downloadImage(stampUrl);
  
  // 4. Embed images in PDF
  const sigImage = await pdfDoc.embedPng(signatureImage);
  const stampImg = await pdfDoc.embedPng(stampImage);
  
  // 5. Position signature and stamp on last page
  const { width, height } = lastPage.getSize();
  
  // Signature (bottom right)
  lastPage.drawImage(sigImage, {
    x: width - 250,
    y: 80,
    width: 200,
    height: 60
  });
  
  // Stamp (bottom left)
  lastPage.drawImage(stampImg, {
    x: 50,
    y: 80,
    width: 80,
    height: 80
  });
  
  // 6. Add certification text
  lastPage.drawText(`Certified by: ${lawyerName}`, {
    x: 50,
    y: 50,
    size: 10,
    color: rgb(0, 0, 0)
  });
  
  lastPage.drawText(`License: ${licenseNumber} | ${firmName}`, {
    x: 50,
    y: 35,
    size: 8,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  lastPage.drawText(`Certificate ID: ${certificateId}`, {
    x: 50,
    y: 20,
    size: 8,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  // 7. Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(
    `https://wakili-pro.com/verify/${certificateId}`
  );
  const qrImage = await pdfDoc.embedPng(qrCodeUrl);
  
  // 8. Add QR code to page
  lastPage.drawImage(qrImage, {
    x: width - 100,
    y: 20,
    width: 60,
    height: 60
  });
  
  // 9. Save modified PDF
  const signedPdfBytes = await pdfDoc.save();
  
  // 10. Upload to Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(
    signedPdfBytes,
    `certified_${certificateId}.pdf`
  );
  
  return cloudinaryUrl;
}
```

#### Generate Certificate of Authenticity

```typescript
async generateCertificate(options: {
  documentTitle: string;
  certificateId: string;
  lawyerName: string;
  licenseNumber: string;
  firmName: string;
  firmAddress: string;
  certificationDate: Date;
  qrCodeData: string;
}): Promise<string> {
  
  // 1. Create new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  // 2. Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // 3. Add decorative header
  page.drawRectangle({
    x: 0,
    y: 742,
    width: 595,
    height: 100,
    color: rgb(0.2, 0.3, 0.7)
  });
  
  // 4. Title
  page.drawText('CERTIFICATE OF AUTHENTICITY', {
    x: 100,
    y: 780,
    size: 24,
    font: boldFont,
    color: rgb(1, 1, 1)
  });
  
  // 5. Certificate ID
  page.drawText(`Certificate No: ${certificateId}`, {
    x: 50,
    y: 680,
    size: 14,
    font: boldFont
  });
  
  // 6. Document details
  page.drawText('This certifies that the document:', {
    x: 50,
    y: 640,
    size: 12,
    font: regularFont
  });
  
  page.drawText(`"${documentTitle}"`, {
    x: 70,
    y: 620,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  
  // 7. Certification statement
  const statement = `Has been reviewed and certified by ${firmName} on ${certificationDate.toLocaleDateString('en-KE')}. This document has been verified for legal compliance and accuracy.`;
  
  page.drawText(statement, {
    x: 50,
    y: 580,
    size: 11,
    font: regularFont,
    maxWidth: 495,
    lineHeight: 16
  });
  
  // 8. Lawyer details
  page.drawText('Certified by:', { x: 50, y: 500, size: 12, font: boldFont });
  page.drawText(lawyerName, { x: 50, y: 480, size: 12 });
  page.drawText(`License: ${licenseNumber}`, { x: 50, y: 460, size: 10 });
  page.drawText(firmName, { x: 50, y: 440, size: 10 });
  page.drawText(firmAddress, { x: 50, y: 420, size: 10, color: rgb(0.4, 0.4, 0.4) });
  
  // 9. Generate and embed QR code
  const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
  const qrImage = await pdfDoc.embedPng(qrCodeUrl);
  
  page.drawImage(qrImage, {
    x: 400,
    y: 420,
    width: 120,
    height: 120
  });
  
  page.drawText('Scan to verify', {
    x: 430,
    y: 400,
    size: 9,
    color: rgb(0.4, 0.4, 0.4)
  });
  
  // 10. Footer
  page.drawText('Wakili Pro - Legal Document Certification Platform', {
    x: 150,
    y: 50,
    size: 10,
    color: rgb(0.5, 0.5, 0.5)
  });
  
  page.drawText('Verify: https://wakili-pro.com/verify/' + certificateId, {
    x: 130,
    y: 35,
    size: 9,
    color: rgb(0.3, 0.3, 0.7)
  });
  
  // 11. Save and upload
  const certificateBytes = await pdfDoc.save();
  const cloudinaryUrl = await uploadToCloudinary(
    certificateBytes,
    `certificate_${certificateId}.pdf`
  );
  
  return cloudinaryUrl;
}
```

---

### **Phase 6: Client Notification & Download**

#### Email to Client

```html
Subject: 🎉 Certificate Ready! "Contract Agreement" - ID: WP-1705320600000

<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
                color: white; padding: 30px; text-align: center;">
      <h1>🎉 Your Document is Certified!</h1>
    </div>
    
    <div style="padding: 30px;">
      <p>Hi Peter,</p>
      
      <p>Great news! Your document has been reviewed and certified by our legal team.</p>
      
      <h3>Document Details:</h3>
      <ul>
        <li><strong>Document:</strong> Contract Agreement Review</li>
        <li><strong>Certified by:</strong> Advocate Lucy Chepkemoi</li>
        <li><strong>License:</strong> LSK/12345</li>
        <li><strong>Firm:</strong> Lucy & Associates Advocates</li>
        <li><strong>Certificate ID:</strong> WP-1705320600000</li>
        <li><strong>Date:</strong> January 15, 2024</li>
      </ul>
      
      <h3>Downloads:</h3>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://wakili-pro.com/api/downloads/certified_WP-1705320600000.pdf"
           style="display: inline-block; background: #10b981; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                  margin: 5px;">
          📄 Download Certified Document
        </a>
        
        <a href="https://wakili-pro.com/api/downloads/certificate_WP-1705320600000.pdf"
           style="display: inline-block; background: #6366f1; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                  margin: 5px;">
          🏆 Download Certificate
        </a>
      </div>
      
      <h3>Features:</h3>
      <ul>
        <li>✅ Digital signature and certification</li>
        <li>✅ Official stamp and firm letterhead</li>
        <li>✅ Secure QR code verification</li>
        <li>✅ Legally binding and admissible</li>
      </ul>
      
      <div style="background: #f3f4f6; border-left: 4px solid #6366f1; 
                  padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Verify Certificate:</strong></p>
        <p style="margin: 5px 0 0 0;">
          <a href="https://wakili-pro.com/verify/WP-1705320600000">
            https://wakili-pro.com/verify/WP-1705320600000
          </a>
        </p>
      </div>
      
      <p>Best regards,<br><strong>Wakili Pro Team</strong></p>
    </div>
    
    <div style="background: #f9fafb; text-align: center; padding: 20px;">
      © 2024 Wakili Pro. All rights reserved.<br>
      Need help? Contact us at support@wakilipro.com
    </div>
  </div>
</body>
</html>
```

#### SMS to Client

```
Wakili Pro: Your document "Contract Agreement" is certified! 
Certificate ID: WP-1705320600000. Download: wakili-pro.com/dashboard/documents
```

---

### **Phase 7: Client Views Certified Documents**

**Frontend:** `DocumentReviewDashboard.tsx` (`/dashboard/documents`)

#### Dashboard Display

```typescript
interface DocumentReview {
  id: string;
  documentName: string;
  status: 'pending_payment' | 'pending_lawyer_assignment' | 
          'assigned' | 'in_progress' | 'completed';
  reviewType: 'AI_REVIEW' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION';
  createdAt: string;
  assignedLawyer?: {
    firstName: string;
    lastName: string;
    licenseNumber: string;
  };
  aiReviewResults?: {
    overallScore: number;
    legalCompliance: number;
    clarity: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    findings: Array<any>;
    summary: string;
  };
  certifiedDocumentUrl?: string;
  certificateUrl?: string;
  certificateId?: string;
}
```

#### UI Example

```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Contract Agreement Review                      COMPLETED  │
│ Certification + AI Review                                    │
│                                                              │
│ ⭐ AI Review Score: 85/100                                   │
│ ✅ Legal Compliance: 90%                                     │
│ 📊 Risk Level: LOW                                           │
│                                                              │
│ 👨‍⚖️ Certified by: Advocate Lucy Chepkemoi (LSK/12345)       │
│ 🏢 Firm: Lucy & Associates Advocates                         │
│ 📅 Certified: Jan 15, 2024                                   │
│ 🆔 Certificate: WP-1705320600000                             │
│                                                              │
│ [📥 Download Certified Document]  [🏆 Download Certificate]  │
│ [🔍 Verify Certificate]                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints Reference

### Document Payment

```
POST /api/document-payment/initiate
POST /api/document-payment/mpesa-callback
POST /api/document-payment/flutterwave-webhook
GET  /api/document-payment/:paymentId/status
POST /api/payments/:paymentId/manual-complete (testing only)
```

### Document Certification

```
POST /api/certification/certify
GET  /api/certification/queue
GET  /api/certification/verify/:certificateId
```

### Lawyer Letterhead Setup

```
POST /api/lawyer/letterhead           # Save letterhead settings
POST /api/lawyer/letterhead/signature # Upload signature image
POST /api/lawyer/letterhead/stamp     # Upload stamp image
GET  /api/lawyer/letterhead           # Get current settings
```

### Document Reviews

```
GET  /api/document-reviews            # Client's reviews
GET  /api/document-reviews/:id        # Single review details
```

---

## 🗄️ Database Schema

### DocumentReview

```prisma
model DocumentReview {
  id                    String   @id @default(cuid())
  userId                String
  documentId            String?
  reviewType            String   // AI_REVIEW, CERTIFICATION, AI_PLUS_CERTIFICATION
  status                String   @default("pending_payment")
  
  // Payment
  paidAt                DateTime?
  amount                Float?
  
  // Lawyer Assignment
  lawyerId              String?
  assignedAt            DateTime?
  estimatedDeliveryDate DateTime?
  
  // AI Review
  reviewResults         Json?    // AI analysis results
  
  // Certification
  certifiedAt           DateTime?
  certificateId         String?
  certificationNotes    String?
  certifiedDocumentUrl  String?  // Cloudinary URL
  certificateUrl        String?  // Cloudinary URL
  
  // Relations
  user                  User     @relation(...)
  lawyer                User?    @relation(...)
  userDocument          UserDocument? @relation(...)
  payments              Payment[] @relation(...)
  
  @@index([status])
  @@index([lawyerId])
}
```

### LawyerLetterhead

```prisma
model LawyerLetterhead {
  id                String   @id @default(cuid())
  lawyerId          String   @unique
  
  // Signature & Stamp
  signatureUrl      String?  // Cloudinary URL
  stampUrl          String?  // Cloudinary URL
  
  // Firm Details
  firmName          String
  firmAddress       String?
  firmPhone         String?
  firmEmail         String?
  licenseNumber     String
  
  // Certificate Settings
  certificatePrefix String   @default("WP")
  
  // Admin Approval
  isApproved        Boolean  @default(false)
  approvedAt        DateTime?
  approvedBy        String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  lawyer            User     @relation(...)
}
```

### Payment

```prisma
model Payment {
  id                String   @id @default(cuid())
  userId            String
  amount            Float
  currency          String   @default("KES")
  status            String   // PENDING, PAID, FAILED, REFUNDED
  
  paymentMethod     String   // MPESA, CARD
  provider          String   // MPESA, FLUTTERWAVE
  
  transactionId     String?
  checkoutRequestId String?
  
  metadata          Json?
  verifiedAt        DateTime?
  
  // Relations
  user              User     @relation(...)
  documentReviews   DocumentReview[] @relation(...)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([status])
  @@index([userId])
}
```

---

## 🧪 Testing Workflow (Production)

### Setup Test Accounts

**Client:**
- Email: mpmbugua.peter@gmail.com
- Phone: 254712345678

**Lawyer:**
- Email: lucy.advocate@wakili-pro.com
- Name: Advocate Lucy Chepkemoi
- License: LSK/12345
- Tier: PRO (unlimited certifications)

### Step-by-Step Test

#### 1. Lawyer Setup (One-time)

```bash
# Login as lucy.advocate@wakili-pro.com
# Navigate to: /lawyer/signature-setup

# Upload:
1. Digital signature image (PNG, transparent background)
2. Official stamp/seal image (PNG)
3. Fill firm details:
   - Firm Name: Lucy & Associates Advocates
   - Address: Westlands, Nairobi
   - Phone: +254700123456
   - Email: info@lucyadvocates.co.ke
   - License: LSK/12345
   - Certificate Prefix: WP

# Admin approves letterhead
```

#### 2. Client Uploads Document

```bash
# Login as mpmbugua.peter@gmail.com
# Navigate to: /dashboard/documents/upload

# Upload document:
1. Select PDF file: "Contract Agreement.pdf"
2. Service Type: "AI Review + Certification"
3. Urgency: "Standard"
4. Price displayed: KES 1,800
5. Click "Proceed to Payment"
```

#### 3. Payment Processing

**Option A: M-Pesa (Real)**
```bash
# Payment page shows:
1. Amount: KES 1,800
2. Phone: 254712345678
3. Click "Pay with M-Pesa"
4. STK Push sent to phone
5. Enter M-Pesa PIN on phone
6. Webhook processes payment
7. Redirect to dashboard
```

**Option B: Manual Complete (Testing)**
```bash
# Get payment ID from logs or database
POST https://wakili-pro.onrender.com/api/payments/:paymentId/manual-complete
Headers: { Authorization: Bearer <admin-token> }

# Response:
{
  "success": true,
  "message": "Payment marked as paid and workflow triggered"
}
```

#### 4. Verify AI Review

```bash
# Check backend logs for:
[DocumentPayment] AI review started for review: <reviewId>
[DocumentAI] Extracting text from PDF...
[DocumentAI] Sending to OpenAI for analysis...
[DocumentAI] Review complete - Score: 85/100

# Database check:
SELECT reviewResults FROM DocumentReview WHERE id = '<reviewId>'

# Should contain JSON with scores and findings
```

#### 5. Verify Lawyer Assignment

```bash
# Check backend logs for:
[LawyerAssignment] Assigning lawyer to review: <reviewId>
[LawyerAssignment] Found 3 eligible lawyers
[LawyerAssignment] Assigning lawyer: lucy.advocate@wakili-pro.com
[LawyerAssignment] Lawyer assigned successfully
[Notification] Email sent to: mpmbugua.peter@gmail.com
[Notification] SMS sent to: 254712345678
[Notification] Email sent to: lucy.advocate@wakili-pro.com

# Database check:
SELECT status, lawyerId, assignedAt FROM DocumentReview 
WHERE id = '<reviewId>'

# Should show:
# status: 'assigned'
# lawyerId: <lucy-user-id>
# assignedAt: <timestamp>
```

#### 6. Lawyer Certifies Document

```bash
# Login as lucy.advocate@wakili-pro.com
# Navigate to: /lawyer/certifications

# Should see:
1. Certification queue with document
2. Click "Review & Certify"
3. View PDF in new tab
4. Add notes: "Document reviewed. All clauses compliant."
5. Click "Certify Document"

# Backend processes:
1. Verifies lawyer has letterhead setup
2. Downloads original PDF
3. Applies signature and stamp
4. Generates Certificate of Authenticity with QR code
5. Uploads both PDFs to Cloudinary
6. Updates DocumentReview with URLs
7. Sends email to client
```

#### 7. Client Downloads Certified Documents

```bash
# Check email: mpmbugua.peter@gmail.com
# Subject: "🎉 Certificate Ready! 'Contract Agreement' - ID: WP-..."

# Email contains:
1. Certificate ID
2. Download link for certified document
3. Download link for certificate
4. Verification URL

# Or navigate to: /dashboard/documents
# Should show:
1. Status: COMPLETED
2. AI Review Score: 85/100
3. Certified by: Advocate Lucy Chepkemoi
4. Download buttons for both PDFs
5. Verify certificate link
```

#### 8. Verify Certificate

```bash
# Navigate to: /verify/WP-1705320600000

# Should display:
✅ Certificate Valid
Certificate ID: WP-1705320600000
Document: Contract Agreement
Certified by: Advocate Lucy Chepkemoi
License: LSK/12345
Firm: Lucy & Associates Advocates
Date: January 15, 2024

[View Certified Document] [View Certificate]
```

---

## 🔍 Troubleshooting

### Payment not triggering workflow

**Check:**
```sql
-- Verify payment status
SELECT id, status, verifiedAt FROM Payment WHERE id = '<paymentId>';

-- Check documentReview status
SELECT id, status, paidAt FROM DocumentReview WHERE id = '<reviewId>';
```

**Fix:**
```bash
# Manually trigger workflow
POST /api/payments/:paymentId/manual-complete
```

### Lawyer not receiving notifications

**Check:**
```sql
-- Verify lawyer email
SELECT email, firstName, lastName FROM User WHERE id = '<lawyerId>';

-- Check review assignment
SELECT lawyerId, assignedAt FROM DocumentReview WHERE id = '<reviewId>';
```

**Debug:**
```bash
# Backend logs should show:
[Notification] Email sent to: lucy.advocate@wakili-pro.com
[Notification] SMS sent to: +254700123456
```

### Certification fails - Missing letterhead

**Error:**
```json
{
  "success": false,
  "message": "Please complete signature and stamp setup first"
}
```

**Fix:**
```bash
# Lawyer must complete:
1. Navigate to /lawyer/signature-setup
2. Upload signature image
3. Upload stamp image
4. Fill all firm details
5. Admin approves setup
```

### QR code not working

**Check:**
```sql
SELECT certificateId, certifiedDocumentUrl, certificateUrl 
FROM DocumentReview WHERE id = '<reviewId>';
```

**Verify:**
```bash
# Certificate ID format: WP-1705320600000
# QR should encode: https://wakili-pro.com/verify/WP-1705320600000

# Test manually:
GET https://wakili-pro.onrender.com/api/certification/verify/WP-1705320600000
```

---

## ✅ Production Checklist

- [x] Payment integration (M-Pesa + Flutterwave)
- [x] Payment webhooks
- [x] Manual payment completion endpoint (testing)
- [x] AI document review service
- [x] Lawyer assignment algorithm
- [x] Email/SMS notifications
- [x] Lawyer letterhead setup page
- [x] Document certification page (lawyer)
- [x] PDF signing service (signature + stamp)
- [x] Certificate generation (with QR code)
- [x] Client document dashboard
- [x] Certificate verification endpoint
- [ ] End-to-end production test
- [ ] All email templates verified
- [ ] All SMS notifications verified
- [ ] QR code scanning tested
- [ ] Download links working
- [ ] Error handling tested

---

## 📝 Notes

- **Tier Limits:** FREE (2 total), LITE (5/month), PRO (unlimited)
- **Payment Methods:** M-Pesa (Kenya), Flutterwave (International cards)
- **AI Model:** OpenAI GPT-4
- **File Storage:** Cloudinary
- **Email Provider:** AWS SES / SendGrid
- **SMS Provider:** Africa's Talking
- **QR Library:** qrcode npm package
- **PDF Library:** pdf-lib + pdf-parse

---

**Last Updated:** January 15, 2024  
**Status:** Ready for Production Testing  
**Next Steps:** Complete end-to-end test on Render production environment
