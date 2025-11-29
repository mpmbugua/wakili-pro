# Cloudinary Setup Guide for Wakili Pro

## Overview
Wakili Pro uses Cloudinary as the cloud storage provider for user-uploaded documents (contracts, agreements, certificates, etc.). This guide will help you configure Cloudinary for both development and production environments.

## Why Cloudinary?

- ✅ **Free Tier**: 25GB storage, 25GB bandwidth/month
- ✅ **Automatic Format Detection**: Handles PDF, DOC, DOCX, images automatically
- ✅ **CDN Delivery**: Fast global content delivery
- ✅ **Security**: Signed URLs for private documents
- ✅ **Transformations**: Automatic optimization and conversions
- ✅ **Easy Integration**: Simple Node.js SDK

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a **free account**
3. Verify your email address
4. Complete the setup wizard

## Step 2: Get Your Credentials

After signing up, you'll be redirected to the **Dashboard**:

1. Navigate to **Dashboard** → **Account Details**
2. Find your credentials:
   - **Cloud Name**: `dxxxxxxxxx` (unique identifier)
   - **API Key**: `123456789012345` (public key)
   - **API Secret**: `aBcDeFgHiJkLmNoPqRsTuVwXyZ` (private key - keep secret!)

## Step 3: Configure Development Environment

### Local Development (.env file)

Update `backend/.env` with your Cloudinary credentials:

```bash
# Cloudinary Configuration (Document Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Example:**
```bash
CLOUDINARY_CLOUD_NAME="dxyz123abc"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
```

### Test the Configuration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. The fileUploadService will initialize with your credentials
3. Check console for any Cloudinary errors

## Step 4: Configure Production (Render.com)

### Add Environment Variables to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your **backend service** (wakili-pro-backend)
3. Click **Environment** tab
4. Add the following variables:

| Key | Value |
|-----|-------|
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | `your-api-key` |
| `CLOUDINARY_API_SECRET` | `your-api-secret` |

5. Click **Save Changes**
6. Render will automatically redeploy with new environment variables

## Step 5: Configure Upload Settings (Optional)

### Adjust Upload Limits

In Cloudinary Dashboard:

1. Go to **Settings** → **Upload**
2. Set **Max file size**: 20 MB (matches backend validation)
3. Enable **Auto backup**: For safety
4. Set **Upload presets** for specific folders

### Configure Security

1. **Settings** → **Security**
2. Enable **Signed URLs** for private documents
3. Set **Allowed domains** (optional):
   - `localhost:3000` (development)
   - `your-frontend-domain.com` (production)

### Folder Structure

Cloudinary will automatically create folders based on upload paths:

```
wakili-pro/
├── user-documents/          # User uploaded documents
│   ├── {userId}/
│   │   ├── 1638123456-contract.pdf
│   │   └── 1638234567-agreement.pdf
├── certified-documents/     # Lawyer certified documents
├── lawyer-signatures/       # Digital signatures
├── lawyer-stamps/          # Professional stamps
└── letterheads/            # Lawyer letterheads
```

## Step 6: Verify Integration

### Test Document Upload

1. **Frontend**: Go to Documents page
2. Click **Upload Document**
3. Select a PDF/DOC file
4. Fill in title and type
5. Submit upload

### Check Cloudinary Dashboard

1. Go to **Media Library**
2. Navigate to `user-documents` folder
3. You should see your uploaded file
4. Click the file to see metadata:
   - URL (for downloading)
   - Public ID (for deletion)
   - File size
   - Upload timestamp

### Backend Logs

Check server logs for:
```
[Cloudinary] Upload successful: {publicId}
[Cloudinary] File URL: https://res.cloudinary.com/...
```

## Troubleshooting

### Error: "Invalid cloud_name"
- **Solution**: Double-check `CLOUDINARY_CLOUD_NAME` in .env
- Should match exactly from dashboard (case-sensitive)

### Error: "Invalid API credentials"
- **Solution**: Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`
- Re-copy from Cloudinary dashboard (no extra spaces)

### Error: "Upload failed - 401 Unauthorized"
- **Solution**: API Secret might be incorrect
- Generate new credentials from Cloudinary Settings → Access Keys

### Error: "File too large"
- **Backend limit**: 20MB (fileUploadService.ts)
- **Cloudinary limit**: Check Settings → Upload → Max file size
- **Frontend limit**: Check DocumentsPage upload validation

### Error: "Unsupported file type"
- **Supported formats**: PDF, DOC, DOCX, ODT, TXT
- Check `isValidDocumentType()` in fileUploadService.ts

## Security Best Practices

### 1. Never Commit Secrets
```bash
# ✅ Good - Use environment variables
CLOUDINARY_API_SECRET="secret-value"

# ❌ Bad - Hardcoded in code
const apiSecret = "aBcDeFgHiJkLmNoPqRsTuVwXyZ123456";
```

### 2. Use Signed URLs for Private Documents
```typescript
import { getSignedUrl } from './services/fileUploadService';

const signedUrl = getSignedUrl(publicId, 3600); // Expires in 1 hour
```

### 3. Restrict Upload Access
- Only authenticated users can upload (authenticateToken middleware)
- Validate file types on backend (not just frontend)
- Enforce file size limits

### 4. Monitor Usage
- Check Cloudinary dashboard for bandwidth usage
- Set up alerts for quota limits
- Review uploaded files periodically

## Cost Management

### Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **Users**: Unlimited

### Monitoring Usage
1. Dashboard → **Usage**
2. View current month stats:
   - Storage used
   - Bandwidth consumed
   - Transformations used

### Upgrade Options (If Needed)
- **Plus Plan**: $89/month - 85GB storage, 85GB bandwidth
- **Advanced**: Custom pricing for enterprise
- **Pay-as-you-go**: Available for occasional overages

## API Endpoints Using Cloudinary

### Upload Document
```bash
POST /api/user-documents/upload
Content-Type: multipart/form-data

{
  "document": <file>,
  "title": "My Contract",
  "type": "CONTRACT"
}
```

### Get Document (Returns Cloudinary URL)
```bash
GET /api/user-documents/:id

Response:
{
  "success": true,
  "document": {
    "id": "doc_123",
    "fileUrl": "https://res.cloudinary.com/.../contract.pdf",
    "fileName": "contract.pdf",
    "fileSize": 1048576
  }
}
```

### Delete Document (Removes from Cloudinary)
```bash
DELETE /api/user-documents/:id

# Automatically calls cloudinary.uploader.destroy(publicId)
```

## Additional Resources

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Node.js SDK**: https://cloudinary.com/documentation/node_integration
- **Upload API**: https://cloudinary.com/documentation/upload_images
- **Signed URLs**: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures

## Support

If you encounter issues:
1. Check Cloudinary status: https://status.cloudinary.com/
2. Review error logs in backend console
3. Contact Cloudinary support: support@cloudinary.com
4. Check Wakili Pro documentation

---

**Last Updated**: November 28, 2025  
**Version**: 1.0.0
