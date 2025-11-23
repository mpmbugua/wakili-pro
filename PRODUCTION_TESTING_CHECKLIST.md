# Production Testing Checklist

**Created:** November 23, 2025
**Status:** Ready for testing after deployment completes

## 🎯 Pre-Test Requirements

### Deployment Status
- [x] AI Assistant code pushed to GitHub
- [ ] Render backend auto-deploy triggered (check dashboard)
- [ ] Render backend deployment completed
- [x] OAuth environment variables updated on Render
- [x] OAuth propagation waited (15+ minutes)

### URLs
- **Frontend:** https://wakili-pro-1.onrender.com
- **Backend:** https://wakili-pro.onrender.com
- **Render Dashboard:** https://dashboard.render.com

---

## 🧪 Test Cases

### 1. Google OAuth Login ✅

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/login
2. Click "Continue with Google"
3. Select Google account
4. Authorize the app
5. Verify redirect to dashboard

**Expected Result:**
- Successful redirect to `https://wakili-pro.onrender.com/api/auth/google/callback`
- JWT token set in cookies
- Redirect to frontend dashboard
- User logged in

**Configuration Verified:**
- ✅ Google Authorized JavaScript Origins: `https://wakili-pro.onrender.com`, `https://wakili-pro-1.onrender.com`
- ✅ Google Redirect URI: `https://wakili-pro.onrender.com/api/auth/google/callback`
- ✅ Backend GOOGLE_CALLBACK_URL: `https://wakili-pro.onrender.com/api/auth/google/callback`

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 2. Facebook OAuth Login ✅

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/login
2. Click "Continue with Facebook"
3. Select Facebook account or log in
4. Authorize the app
5. Verify redirect to dashboard

**Expected Result:**
- Successful redirect to `https://wakili-pro.onrender.com/api/auth/facebook/callback`
- JWT token set in cookies
- Redirect to frontend dashboard
- User logged in

**Configuration Verified:**
- ✅ Facebook Valid OAuth Redirect URI: `https://wakili-pro.onrender.com/api/auth/facebook/callback`
- ✅ Facebook Allowed Domains: `wakili-pro.onrender.com`, `wakili-pro-1.onrender.com`
- ✅ Backend FACEBOOK_CALLBACK_URL: `https://wakili-pro.onrender.com/api/auth/facebook/callback`

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 3. AI Assistant - Text Query 🤖

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/ai
2. Type a legal question: "How do I register a business in Kenya?"
3. Click "Send"
4. Wait for AI response

**Expected Result:**
- ✅ Loading indicator shows
- ✅ AI response appears (NOT hardcoded)
- ✅ Response includes real OpenAI-generated content
- ✅ Sources array displayed (if applicable)
- ✅ Consultation suggestion displayed (if applicable)
- ❌ NO hardcoded sample responses (e.g., "STEP-BY-STEP PROCESS:")

**Backend Integration:**
- Endpoint: `POST /api/ai/ask`
- OpenAI API Key: Configured in backend .env
- Expected response structure:
  ```json
  {
    "success": true,
    "data": {
      "answer": "...",
      "sources": [...],
      "consultationSuggestion": {...}
    }
  }
  ```

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 4. AI Assistant - File Upload 📎

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/ai
2. Click the attachment icon (📎)
3. Upload an image (e.g., screenshot of a contract)
4. Type: "Analyze this document"
5. Click "Send"

**Expected Result:**
- ✅ File preview shows before sending
- ✅ File uploads successfully
- ✅ AI analyzes the uploaded file
- ✅ Response references the document content
- ✅ No file size errors (max 10MB per file)

**Backend Configuration:**
- Multer middleware: `userUpload.array('attachments', 5)`
- Max files: 5
- Max size: 10MB per file
- Allowed types: Images (JPEG, PNG, GIF, WebP), Documents (PDF, DOC, DOCX)

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 5. AI Assistant - Camera Capture 📷

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/ai (on mobile or desktop with camera)
2. Click the camera icon
3. Grant camera permission
4. Take a photo
5. Type: "What is this?"
6. Click "Send"

**Expected Result:**
- ✅ Camera opens successfully
- ✅ Photo captured
- ✅ Preview shows
- ✅ AI analyzes the image
- ✅ Response describes the image content

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 6. AI Assistant - Voice Query 🎤

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/ai
2. Click the microphone icon
3. Grant microphone permission
4. Speak: "How do I get a marriage certificate in Kenya?"
5. Click microphone again to stop recording
6. Wait for transcription and response

**Expected Result:**
- ✅ Recording indicator shows (red pulsing button)
- ✅ Audio recorded successfully
- ✅ Transcription displayed as user message
- ✅ AI responds to transcribed query
- ✅ Response is relevant to the spoken question

**Backend Integration:**
- Endpoint: `POST /api/ai/voice-query`
- Audio format: WebM (base64 encoded)
- Expected flow:
  1. Frontend sends audio blob (base64)
  2. Backend transcribes via OpenAI Whisper
  3. Backend processes query via OpenAI GPT
  4. Response returned with answer + sources

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 7. Backend Health Check ✅

**Steps:**
1. Navigate to: https://wakili-pro.onrender.com/api/health
   OR: https://wakili-pro.onrender.com/health

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T...",
  "uptime": 123.45,
  "message": "Wakili Pro API is running"
}
```

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

### 8. Email Authentication (Regression Test) 📧

**Steps:**
1. Navigate to: https://wakili-pro-1.onrender.com/register
2. Fill in registration form with valid email
3. Click "Sign Up"
4. Check email for verification link
5. Click verification link
6. Log in

**Expected Result:**
- ✅ Registration successful
- ✅ Verification email sent
- ✅ Token includes `expiresAt` field (previous bug fix)
- ✅ Login successful after verification

**Previous Fix:**
- Commit: 62b1c8b
- Issue: Missing `expiresAt` in email verification token
- Status: Should still be working

**Pass/Fail:** [ ]

**Notes:**
_____________________________________________________________________

---

## 🐛 Error Scenarios

### Test 1: Invalid File Type
- Upload a .exe or .zip file to AI Assistant
- **Expected:** Error message, file rejected

**Pass/Fail:** [ ]

---

### Test 2: File Too Large
- Upload a file >10MB to AI Assistant
- **Expected:** Error message, file rejected

**Pass/Fail:** [ ]

---

### Test 3: Network Error
- Disconnect internet while sending AI query
- **Expected:** User-friendly error message (not hardcoded fallback)

**Pass/Fail:** [ ]

---

### Test 4: OAuth Cancellation
- Start Google/Facebook login, then cancel
- **Expected:** Redirect back to login page, no crash

**Pass/Fail:** [ ]

---

## 📊 Deployment Verification

### Backend Logs Check
1. Go to Render Dashboard → wakili-pro → Logs
2. Verify:
   - ✅ Deployment successful
   - ✅ No startup errors
   - ✅ Environment variables loaded (GOOGLE_CALLBACK_URL, FACEBOOK_CALLBACK_URL, OPENAI_API_KEY)
   - ✅ Database connected
   - ✅ Server listening on port (from process.env.PORT)

**Pass/Fail:** [ ]

---

### Frontend Logs Check
1. Go to Render Dashboard → wakili-pro-1 → Logs
2. Verify:
   - ✅ Build successful
   - ✅ Nginx serving static files
   - ✅ No 404 errors on assets

**Pass/Fail:** [ ]

---

## 🎉 Success Criteria

All tests must pass for deployment to be considered successful:

- [ ] Google OAuth login works
- [ ] Facebook OAuth login works
- [ ] AI Assistant returns real OpenAI responses (not hardcoded)
- [ ] File upload to AI works
- [ ] Camera capture to AI works
- [ ] Voice recording to AI works
- [ ] Backend health check responds
- [ ] Email authentication still works (regression test)
- [ ] Error handling works gracefully
- [ ] No console errors on frontend
- [ ] Backend logs show no errors

---

## 🔧 Troubleshooting

### OAuth Issues
**Symptom:** Redirect URI mismatch error

**Solutions:**
1. Check OAuth console configuration (Google/Facebook)
2. Verify Render environment variables:
   - `GOOGLE_CALLBACK_URL=https://wakili-pro.onrender.com/api/auth/google/callback`
   - `FACEBOOK_CALLBACK_URL=https://wakili-pro.onrender.com/api/auth/facebook/callback`
3. Wait 5-10 minutes for propagation
4. Clear browser cookies and try again

---

### AI Assistant Returns Hardcoded Responses
**Symptom:** Still seeing "STEP-BY-STEP PROCESS:" in responses

**Solutions:**
1. Verify frontend deployment includes latest commit
2. Check browser cache - hard refresh (Ctrl+Shift+R)
3. Check frontend is serving AIAssistant.tsx from latest build
4. Verify backend `/api/ai/ask` endpoint is receiving requests

---

### Voice Recording Not Working
**Symptom:** Microphone button does nothing or error alert

**Solutions:**
1. Grant microphone permissions in browser
2. Use HTTPS (required for getUserMedia API)
3. Check browser console for errors
4. Try different browser (Chrome recommended)

---

### File Upload Fails
**Symptom:** "Network error" or timeout

**Solutions:**
1. Check file size (<10MB)
2. Check file type (images, PDF, DOC, DOCX only)
3. Verify backend multer middleware configured
4. Check Render logs for upload errors

---

## 📝 Testing Notes

**Tester:**  ___________________________

**Date:**    ___________________________

**Browser:** ___________________________

**Device:**  ___________________________

**Overall Status:** ⬜ PASS  ⬜ FAIL

**Additional Comments:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________

---

## ✅ Sign-off

Once all tests pass:

1. Update this checklist with results
2. Mark deployment as successful
3. Notify stakeholders
4. Archive this checklist for reference

**Deployment Signed Off By:** ___________________________

**Date:** ___________________________
