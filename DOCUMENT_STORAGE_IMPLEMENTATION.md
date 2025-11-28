# Document Storage Implementation

## Overview
Implemented complete document storage system for Wakili Pro, allowing users to upload, manage, and request reviews for their legal documents. Chat messages between lawyers and users are also persisted for reference.

## Features Implemented

### 1. **User Document Management**
- Upload documents (PDF, DOC, DOCX, TXT)
- Store documents in Cloudinary cloud storage
- List all user documents with filtering
- Update document metadata
- Soft delete documents
- Request AI review or lawyer certification

### 2. **Database Schema**
Added `UserDocument` model with:
- Document metadata (title, type, category, status)
- File information (URL, size, filename, MIME type)
- Source tracking (uploaded, purchased, generated, consultation)
- Soft delete support
- Relations to users, templates, and reviews

### 3. **File Storage (Cloudinary)**
- Automatic file upload to cloud storage
- Organized folder structure: `user-documents/{userId}/`
- Support for multiple file types
- File validation (type and size)
- Secure file URLs

### 4. **API Endpoints**

#### Upload Document
```
POST /api/user-documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- document: File
- title: string
- type: DocumentType (CONTRACT, AGREEMENT, etc.)
- category?: string
```

#### Get User Documents
```
GET /api/user-documents?status={status}&type={type}&search={search}
Authorization: Bearer {token}
```

#### Get Single Document
```
GET /api/user-documents/:id
Authorization: Bearer {token}
```

#### Update Document
```
PATCH /api/user-documents/:id
Authorization: Bearer {token}

Body:
{
  "title"?: string,
  "type"?: DocumentType,
  "category"?: string,
  "status"?: DocumentStatus
}
```

#### Delete Document
```
DELETE /api/user-documents/:id
Authorization: Bearer {token}
```

#### Request Review
```
POST /api/user-documents/:id/request-review
Authorization: Bearer {token}

Body:
{
  "reviewType": "AI_REVIEW" | "CERTIFICATION"
}
```

## Document Types
- `CONTRACT` - Legal contracts
- `AGREEMENT` - Various agreements
- `CERTIFICATE` - Certificates and licenses
- `COURT_FILING` - Court documents
- `LETTER` - Legal letters
- `MEMORANDUM` - Legal memoranda
- `AFFIDAVIT` - Sworn statements
- `WILL` - Last will and testament
- `POWER_OF_ATTORNEY` - Power of attorney documents
- `OTHER` - Other document types

## Document Status
- `DRAFT` - Newly uploaded, not yet reviewed
- `UNDER_REVIEW` - Currently being reviewed
- `REVIEWED` - Review completed
- `FINALIZED` - Final version
- `ARCHIVED` - Archived documents

## Document Sources
- `UPLOADED` - User uploaded directly
- `PURCHASED` - Bought from marketplace
- `GENERATED` - AI-generated or customized template
- `CONSULTATION` - Generated from video consultation

## Chat Message Persistence

### Existing ChatMessage Model
The system already has a robust `ChatMessage` model that persists all lawyer-client conversations:

```prisma
model ChatMessage {
  id          String   @id @default(cuid())
  roomId      String
  senderId    String
  clientId    String
  messageType String   @default("TEXT")
  content     String?
  fileUrl     String?
  fileName    String?
  fileSize    Int?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  editedAt    DateTime?
  
  room   ChatRoom @relation(fields: [roomId], references: [id])
  sender User     @relation("MessageSender", fields: [senderId], references: [id])
  client User     @relation("ChatMessage_clientIdToUser", fields: [clientId], references: [id])
}
```

### Features:
- ✅ **Permanent Storage**: All messages stored in PostgreSQL
- ✅ **File Attachments**: Support for file sharing in chat
- ✅ **Read Receipts**: Track message read status
- ✅ **Message Types**: TEXT, FILE, IMAGE, DOCUMENT, SYSTEM
- ✅ **Edit History**: Track message edits
- ✅ **Chat Rooms**: Organized by conversation rooms
- ✅ **User References**: Links to both sender and client

### Accessing Chat History:
Users can retrieve all their chat messages by querying the `ChatMessage` table filtered by `clientId` or `roomId`. This provides complete conversation history for legal reference.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install cloudinary multer @types/multer
```

### 2. Configure Cloudinary
Sign up for a free Cloudinary account at [cloudinary.com](https://cloudinary.com)

Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_user_documents
npx prisma generate
```

### 4. Build and Deploy
```bash
# Backend
cd backend
npm run build

# Frontend (already updated)
cd frontend
npm run build
```

## Frontend Integration

### DocumentsPage Updates
- ✅ Connected to real API endpoints
- ✅ File upload with progress
- ✅ Document list with filtering
- ✅ Request review workflow
- ✅ Error handling and fallback to mock data

### Upload Flow
1. User clicks "Upload Document"
2. Selects file (validated client-side)
3. Provides title and metadata
4. File uploaded to backend via multipart/form-data
5. Backend validates and uploads to Cloudinary
6. Database record created
7. Frontend refreshes document list

### Review Request Flow
1. User uploads document (status: DRAFT)
2. Clicks "Request Review"
3. API call updates status to UNDER_REVIEW
4. Creates DocumentReview record
5. Navigates to payment page
6. After payment, review begins

## Storage Organization

### Cloudinary Folder Structure
```
user-documents/
  ├── {userId}/
  │   ├── uploaded/           # User uploads
  │   ├── purchased/          # Marketplace purchases
  │   └── generated/          # AI-generated docs
  └── ...
```

## File Size and Type Limits
- **Max File Size**: 20MB
- **Allowed Types**: 
  - PDF (application/pdf)
  - DOC (application/msword)
  - DOCX (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
  - TXT (text/plain)

## Security Features
- ✅ **Authentication Required**: All endpoints require JWT token
- ✅ **User Isolation**: Users can only access their own documents
- ✅ **File Validation**: Type and size validation
- ✅ **Soft Delete**: Documents marked as deleted, not permanently removed
- ✅ **Secure URLs**: Cloudinary provides HTTPS URLs

## Integration with Existing Features

### Document Review System
- Uploaded documents can be submitted for AI review or lawyer certification
- Creates `DocumentReview` record linked to the uploaded document
- Tracks review progress and status

### Marketplace Integration
- Purchased templates automatically stored as UserDocuments
- Source field set to `PURCHASED`
- Links to original template via `templateId`

### Video Consultations
- Documents generated during consultations stored with source `CONSULTATION`
- Associated with consultation recording

## Performance Considerations
- **Async Upload**: File uploads processed asynchronously
- **Streaming**: Uses streams for efficient memory usage
- **CDN Delivery**: Cloudinary provides global CDN for fast file access
- **Database Indexing**: Indexed on userId, status, and uploadedAt

## Future Enhancements
- [ ] Document versioning
- [ ] Document sharing with lawyers
- [ ] Document templates from uploads
- [ ] OCR text extraction
- [ ] Document search by content
- [ ] Bulk upload support
- [ ] Document expiry dates
- [ ] Download audit trail

## Cost Optimization
- **Cloudinary Free Tier**: 25 GB storage, 25 GB bandwidth/month
- **Soft Delete**: Keeps files for recovery without immediate deletion costs
- **Compressed Storage**: Cloudinary automatically optimizes files
- **Lazy Loading**: Frontend loads documents on-demand

## Monitoring and Logging
- Upload success/failure logged to console
- File validation errors tracked
- User actions audited
- Storage usage can be monitored via Cloudinary dashboard

## Deployment Notes
- ✅ Environment variables required in production
- ✅ Cloudinary credentials stored securely
- ✅ Database migration required before deployment
- ✅ Multer configured for cloud deployment (memory storage)
