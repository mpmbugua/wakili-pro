# 🚀 AI Knowledge Base - Quick Setup Checklist

## ⚠️ CRITICAL FIRST STEPS

### 1. Create Pinecone Index (REQUIRED - 5 minutes)

🔗 **Go to**: https://app.pinecone.io/organizations/-/projects/-/indexes

**Settings**:
```
Name: wakili-legal-kb
Dimensions: 1536
Metric: cosine
Region: us-east1-gcp
```

Click **"Create Index"**

✅ **Verify**: Index should show as "Ready" in dashboard

---

### 2. Run Database Migration (REQUIRED - 2 minutes)

```bash
cd backend
npx prisma migrate dev --name add_legal_documents
npx prisma generate
```

✅ **Verify**: Run `npx prisma studio` and check for "LegalDocument" model

---

### 3. Restart Backend Server (1 minute)

```bash
cd backend
npm run dev
```

✅ **Verify**: Check console for no errors, server running on port 5000

---

## ✅ Testing Checklist

### Frontend Access
- [ ] Login as admin: http://localhost:3000/admin/login
- [ ] See "AI Knowledge Base" button in Admin Dashboard
- [ ] Click button → navigate to `/admin/legal-knowledge`
- [ ] See upload form with statistics cards

### Document Upload Test
- [ ] Select a PDF or DOCX file (< 20MB)
- [ ] Fill in title: "Test Legal Document"
- [ ] Select document type: "Legislation"
- [ ] Select category: "Constitutional Law"
- [ ] Click "Upload & Train AI"
- [ ] See success message: "Document uploaded successfully! X chunks processed"
- [ ] Statistics cards update (Total Documents +1)

### Document Management
- [ ] Uploaded document appears in list below
- [ ] Document shows chunk count and vector count
- [ ] Search bar filters documents
- [ ] Type filter dropdown works
- [ ] Delete button removes document

### Backend API Test (Optional)

```bash
# Get admin JWT token first (login via frontend)
# Then test API:

curl -X GET http://localhost:5000/api/ai/documents/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Should return:
{
  "success": true,
  "data": {
    "totalDocuments": 1,
    "totalChunks": X,
    "totalVectors": X,
    "lastUpdated": "2024-..."
  }
}
```

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to Pinecone"
**Fix**: Create the index first at https://app.pinecone.io

### Issue: "Table LegalDocument does not exist"
**Fix**: Run `npx prisma migrate dev` in backend folder

### Issue: "Access Denied"
**Fix**: Ensure you're logged in as ADMIN or SUPER_ADMIN role

### Issue: "Upload fails with 500 error"
**Fix**: Check backend console logs, verify OpenAI API key is valid

---

## 🎯 What You Can Do Now

Once setup is complete:

1. **Upload Legal Documents** (PDF, DOCX)
   - Constitution of Kenya
   - Employment Act
   - Companies Act
   - Legal case judgments

2. **AI Will Use This Knowledge** For:
   - Document review and analysis
   - Answering user legal questions
   - Finding relevant laws and precedents
   - Generating legal advice

3. **Track Statistics**
   - See how many documents indexed
   - Monitor AI knowledge base growth
   - Identify gaps in legal coverage

---

## 📊 Example Workflow

```
1. Admin uploads "Employment Act, 2007" (PDF)
   ↓
2. System extracts text, creates 150 chunks
   ↓
3. Generates vector embeddings with OpenAI
   ↓
4. Stores 150 vectors in Pinecone
   ↓
5. Saves metadata to PostgreSQL
   ↓
6. Client asks: "What notice period for termination?"
   ↓
7. AI searches Pinecone for "termination notice"
   ↓
8. Finds Employment Act Section 35
   ↓
9. AI responds: "According to Employment Act 2007, Section 35..."
```

---

## 🚀 Next Features to Enable

After basic setup works:

### Web Scraping (Coming Soon)
- Automatic ingestion from kenyalaw.org
- Judiciary of Kenya case database
- Law Society resources

### Bulk Upload
- Upload zip file with multiple PDFs
- Process all documents in one batch

### OCR Support
- Scan and process scanned PDF documents
- Extract text from images

---

## 📝 Quick Reference

**Admin Page**: http://localhost:3000/admin/legal-knowledge

**Backend API**: http://localhost:5000/api/ai/documents

**Pinecone Dashboard**: https://app.pinecone.io

**Database Studio**: `npx prisma studio` (in backend folder)

---

## ✅ Setup Complete When:

- [ ] Pinecone index "wakili-legal-kb" exists and is Ready
- [ ] Database migration applied (LegalDocument table exists)
- [ ] Backend server running without errors
- [ ] Admin can access knowledge base page
- [ ] Test document uploads successfully
- [ ] Statistics show correct counts
- [ ] AI queries can use uploaded knowledge

---

**All done?** Start uploading legal documents and watch the AI get smarter! 🎓
