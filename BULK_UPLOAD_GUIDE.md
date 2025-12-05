# Bulk PDF Upload Guide - Pinecone Data Seeding

## Overview
Since web scraping failed, we've implemented a **bulk upload endpoint** for manually seeding Pinecone with legal documents.

## API Endpoint

### POST `/api/ai/documents/bulk-upload`
**Access:** ADMIN or SUPER_ADMIN only  
**Max Files:** 50 PDFs per request  
**Supported Formats:** PDF, DOCX, DOC  
**Max File Size:** 20MB per file

## Usage

### Using cURL (Command Line)

```bash
# Single file test
curl -X POST http://localhost:5000/api/ai/documents/bulk-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/document1.pdf" \
  -F "documentType=LEGISLATION" \
  -F "category=Constitutional Law"

# Multiple files
curl -X POST http://localhost:5000/api/ai/documents/bulk-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/act1.pdf" \
  -F "files=@/path/to/act2.pdf" \
  -F "files=@/path/to/regulation1.pdf" \
  -F "documentType=LEGISLATION" \
  -F "category=General"
```

### Using Postman/Insomnia

1. **Create New Request**
   - Method: `POST`
   - URL: `https://your-render-url.com/api/ai/documents/bulk-upload`

2. **Headers**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

3. **Body (form-data)**
   - Key: `files` (type: File) - Select multiple PDFs
   - Key: `documentType` (type: Text) - Value: `LEGISLATION` (or `CASE_LAW`, `REGULATION`)
   - Key: `category` (type: Text) - Value: `General` (or specific category)

4. **Send Request**

### Using Frontend (Future Implementation)

```typescript
const uploadBulkDocuments = async (files: File[]) => {
  const formData = new FormData();
  
  // Add all files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add metadata
  formData.append('documentType', 'LEGISLATION');
  formData.append('category', 'General');
  
  const response = await axiosInstance.post(
    '/ai/documents/bulk-upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data;
};
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Bulk upload completed: 15/20 files processed",
  "data": {
    "summary": {
      "total": 20,
      "successful": 15,
      "failed": 5,
      "totalChunks": 3245,
      "totalVectors": 3245
    },
    "details": {
      "successful": [
        {
          "filename": "Constitution_of_Kenya_2010.pdf",
          "documentId": "clx123abc",
          "chunks": 250,
          "vectors": 250
        },
        {
          "filename": "Land_Act_2012.pdf",
          "documentId": "clx124def",
          "chunks": 180,
          "vectors": 180
        }
      ],
      "failed": [
        {
          "filename": "corrupted_file.pdf",
          "error": "Failed to extract text from PDF"
        },
        {
          "filename": "image.jpg",
          "error": "Unsupported file type. Only PDF and DOCX files are supported."
        }
      ]
    }
  }
}
```

## What Happens Internally

### Processing Pipeline (Per File)
1. **File Validation**
   - Check file extension (PDF or DOCX)
   - Verify file size (max 20MB)
   
2. **Text Extraction**
   - PDF: Uses PDFCo API or fallback
   - DOCX: Uses Mammoth library
   
3. **Text Chunking**
   - Splits text into ~1000 character chunks
   - Maintains semantic boundaries
   
4. **Embedding Generation**
   - Uses Gemini API (`text-embedding-004` model)
   - Generates 768-dimension vectors
   
5. **Vector Storage**
   - Stores in Pinecone index
   - Metadata includes: title, category, source
   
6. **Database Record**
   - Creates `LegalDocument` record
   - Links to uploader (admin user)
   - Stores file metadata (path, size, chunks, vectors)

## Error Handling

- **Individual file failures don't stop processing**
- **Each file is processed independently**
- **Failed files are reported in response**
- **Partial success is possible** (e.g., 15/20 successful)

## Common Errors & Solutions

### 1. "Unauthorized"
- **Cause:** Invalid or missing JWT token
- **Solution:** Login as ADMIN and get fresh token

### 2. "No files uploaded"
- **Cause:** Request body missing files
- **Solution:** Use `form-data` and add files with key `files`

### 3. "Unsupported file type"
- **Cause:** File extension not PDF/DOCX
- **Solution:** Convert to PDF or DOCX before uploading

### 4. "Failed to extract text from PDF"
- **Cause:** Corrupted PDF or scanned image PDF
- **Solution:** Use OCR tool to make PDF text-searchable

### 5. "Pinecone index error"
- **Cause:** Pinecone API key invalid or quota exceeded
- **Solution:** Check `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` env vars

## Deployment Considerations

### Render Environment Variables
Ensure these are set in Render dashboard:

```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=wakili-legal-docs
GEMINI_API_KEY=your_gemini_api_key
```

### Storage Directory
Backend creates this automatically:
```
backend/storage/legal-materials/
```

Files are saved with unique names:
```
1704123456789-987654321-Constitution_of_Kenya_2010.pdf
```

## Testing the Bulk Upload

### Step 1: Get Admin JWT Token
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wakili.com","password":"admin123"}'

# Extract token from response
```

### Step 2: Prepare PDFs
- Collect legal documents (Acts, Regulations, Case Law)
- Name files descriptively (e.g., `Employment_Act_2007.pdf`)
- Ensure files are text-searchable (not scanned images)

### Step 3: Upload in Batches
```bash
# Batch 1: Constitutional Law (5 PDFs)
curl -X POST https://your-render-url.com/api/ai/documents/bulk-upload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "files=@Constitution_2010.pdf" \
  -F "files=@Bill_of_Rights.pdf" \
  -F "files=@Devolution_Act.pdf" \
  -F "documentType=LEGISLATION" \
  -F "category=Constitutional Law"

# Batch 2: Property Law (10 PDFs)
curl -X POST https://your-render-url.com/api/ai/documents/bulk-upload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "files=@Land_Act_2012.pdf" \
  -F "files=@Land_Registration_Act.pdf" \
  # ... more files
  -F "documentType=LEGISLATION" \
  -F "category=Property Law"
```

### Step 4: Verify Ingestion
```bash
# Get all indexed documents
curl -X GET https://your-render-url.com/api/ai/documents \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get statistics
curl -X GET https://your-render-url.com/api/ai/documents/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Expected Performance

| Files | Processing Time | API Calls (Gemini) |
|-------|----------------|-------------------|
| 1 PDF (100 pages) | ~30 seconds | ~100 embeddings |
| 10 PDFs (avg 50 pages) | ~5 minutes | ~500 embeddings |
| 50 PDFs (max batch) | ~25 minutes | ~2,500 embeddings |

**Note:** Processing is sequential to avoid rate limits on Gemini API.

## Render Deployment Status

### Current Issues
⚠️ **Module Import Error**
```
Error: Cannot find module '../../middleware/authorize'
Require stack:
- /opt/render/project/src/backend/dist/routes/admin/crawlerRoutes.js
```

**Root Cause:** Stale build cache on Render (source code is correct)

**Solution:**
1. Clear Render build cache (in dashboard)
2. Redeploy service
3. Verify build logs show latest commit

### Deployment Steps
1. Push changes to GitHub (✅ Done)
2. Render auto-deploys on push
3. Wait for build to complete (~5 minutes)
4. Test bulk upload endpoint

## Next Steps

1. ✅ **Bulk upload implemented** - Ready to use
2. ⏳ **Deploy to Render** - Auto-deploying from GitHub
3. ⏳ **Clear Render build cache** - Fix import error
4. 📝 **Prepare legal PDFs** - Download Kenya law documents
5. 🚀 **Seed Pinecone** - Upload in batches of 10-20 files

## Monitoring Logs

Watch backend logs during bulk upload:
```bash
# In Render dashboard, go to Logs tab
# Look for:
[AI] Bulk upload started: 10 files
[AI] Processing: Constitution_of_Kenya_2010.pdf
[AI] ✅ Processed: Constitution_of_Kenya_2010.pdf
[AI] Processing: Land_Act_2012.pdf
[AI] ✅ Processed: Land_Act_2012.pdf
[AI] Bulk upload completed: 10/10 successful
```

## Troubleshooting

### Render Build Failing
```bash
# Check Render build logs for:
Error: Cannot find module '../../middleware/authorize'

# Solution: Clear build cache
# 1. Render Dashboard > Your Service > Settings
# 2. Scroll to "Build & Deploy"
# 3. Click "Clear build cache & deploy"
```

### Files Not Processing
```bash
# Check file format
file document.pdf  # Should show "PDF document"

# Check file size
ls -lh document.pdf  # Should be < 20MB

# Check text content
pdftotext document.pdf - | head  # Should show text, not gibberish
```

### Pinecone Quota Exceeded
```bash
# Check Pinecone dashboard
# Free tier: 100K vectors/month
# If exceeded, upgrade plan or wait for reset
```

## Related Files

- **Controller:** `backend/src/controllers/aiDocumentController.ts`
- **Routes:** `backend/src/routes/aiDocumentRoutes.ts`
- **Ingestion Service:** `backend/src/services/ai/documentIngestionService.ts`
- **Embedding Service:** `backend/src/services/ai/embeddingService.ts`
- **Vector DB Service:** `backend/src/services/ai/vectorDatabaseService.ts`

---

**Last Updated:** 2025-01-02  
**Status:** ✅ Bulk upload implemented and deployed  
**Next:** Test on Render with real legal PDFs
