# Video Consultation Testing Guide
**Date**: December 6, 2025  
**Status**: Ready for Testing ✅

## ✅ Pre-Test Setup Complete

### Backend Setup ✅
- [x] VideoSignalingServer initialized in `backend/src/index.ts`
- [x] Video routes mounted at `/api/video`
- [x] Socket.IO configured for WebRTC signaling
- [x] Cloudinary video upload ready (6MB chunking)
- [x] Environment variables set (`FRONTEND_URL=http://localhost:3173`)
- [x] Build successful ✅

### Frontend Setup ✅
- [x] VideoConsultationPage imported in `App.tsx`
- [x] Route added: `/consultation/:consultationId/video`
- [x] simple-peer dependency installed
- [x] socket.io-client dependency verified
- [x] useVideoConsultation hook configured
- [x] Environment variables set (VITE_API_BASE_URL)
- [x] Build successful ✅

### Dependencies ✅
**Backend**:
- socket.io ✅
- simple-peer@9.11.1 ✅

**Frontend**:
- socket.io-client@4.8.1 ✅
- simple-peer ✅ (just installed)

---

## 🧪 Test Plan (Tomorrow - 45-60 minutes)

### Phase 1: Environment Check (5 minutes)

**1. Start Backend Server**
```bash
cd backend
npm run dev
```
**Expected**: Console shows:
- ✅ "Video signaling server initialized"
- ✅ Server running on port 5000

**2. Start Frontend Server**
```bash
cd frontend
npm run dev
```
**Expected**: Frontend running on http://localhost:3173

---

### Phase 2: Create Test Consultation (10 minutes)

**Option A: Via Booking Flow**
1. Login as client
2. Browse lawyers: http://localhost:3173/lawyers
3. Select a lawyer
4. Book a consultation
5. Create video consultation from booking

**Option B: Direct Database Creation (Faster)**
```sql
-- In PostgreSQL (Render dashboard or local)
INSERT INTO "VideoConsultation" (
  id, roomId, userId, clientId, lawyerId, documentId,
  type, status, amount, scheduledAt, createdAt, updatedAt
) VALUES (
  'test-video-1',
  'room-test-123',
  'CLIENT_USER_ID',
  'CLIENT_USER_ID',
  'LAWYER_USER_ID',
  'ANY_DOCUMENT_TEMPLATE_ID',
  'CONSULTATION',
  'SCHEDULED',
  1500.00,
  NOW() + INTERVAL '1 hour',
  NOW(),
  NOW()
);
```

**Get IDs from database**:
```sql
SELECT id, email, role FROM "User" LIMIT 10;
SELECT id FROM "DocumentTemplate" LIMIT 1;
```

---

### Phase 3: Single Browser Test (15 minutes)

**1. Access Video Room**
- Navigate to: `http://localhost:3173/consultation/test-video-1/video`
- **Expected**:
  - ✅ Camera permission prompt appears
  - ✅ Microphone permission prompt appears
  - ✅ Local video stream shows (your camera)
  - ✅ Connection status: "Connected" (green dot)

**2. Test Controls**
- Click **Video Off** button → Local video should stop
- Click **Video On** → Local video resumes
- Click **Mute** button → Audio muted
- Click **Unmute** → Audio active
- Click **Screen Share** → Screen share selector appears
- Click **Chat** → Chat panel opens

**3. Check Browser Console**
- Press F12 → Console tab
- Look for errors (red text)
- Should see: "Connected to video signaling server"

---

### Phase 4: Multi-User Test (20 minutes)

**Setup**: Need 2 devices/browsers (don't use same browser - WebRTC won't connect)

**Option 1: Two Browsers on Same Computer**
- Browser 1: Chrome (as client)
- Browser 2: Firefox or Edge (as lawyer)

**Option 2: Two Devices**
- Device 1: Your computer
- Device 2: Phone, tablet, or another computer
  - Use ngrok to expose localhost: `ngrok http 3173`
  - Access via ngrok URL on second device

**Test Steps**:

**Browser/Device 1 (Client)**
1. Login with client credentials
2. Navigate to: `/consultation/test-video-1/video`
3. Allow camera/mic permissions
4. Wait for connection

**Browser/Device 2 (Lawyer)**
1. Login with lawyer credentials
2. Navigate to: `/consultation/test-video-1/video`
3. Allow camera/mic permissions
4. **Expected**:
   - ✅ See lawyer's own video (local stream)
   - ✅ See client's video (remote stream)
   - ✅ Participant count shows "2 participants"

**On Client Browser**:
- **Expected**:
  - ✅ See client's own video
  - ✅ See lawyer's video appear
  - ✅ Participant count shows "2 participants"

**Interactive Tests**:
1. **Audio Test**: Talk in Browser 1 → Should hear in Browser 2
2. **Video Toggle**: Turn off video in Browser 1 → Should disappear in Browser 2
3. **Screen Share**: Share screen in Browser 2 → Should see shared screen in Browser 1
4. **Chat**: Send message in Browser 1 → Should appear in Browser 2

---

### Phase 5: Recording Test (10 minutes)

**Note**: Recording only works for lawyers

**In Lawyer Browser**:
1. Click **Start Recording** button (if visible)
2. Conduct 30-second call
3. Click **Stop Recording**
4. Check backend console for: "Recording uploaded to Cloudinary"

**Verify Recording**:
- Login to Cloudinary dashboard: https://cloudinary.com/console
- Navigate to: **Media Library** → `wakili-pro/video-recordings/test-video-1/`
- **Expected**: Video file appears (MP4/WebM)

**Database Check**:
```sql
SELECT * FROM "ConsultationRecording" 
WHERE "consultationId" = 'test-video-1';
```
**Expected**: Row with `recordingUrl` (Cloudinary URL)

---

## 🐛 Troubleshooting Guide

### Issue: "Cannot connect to WebSocket"
**Fix**:
- Check backend is running on port 5000
- Verify `FRONTEND_URL=http://localhost:3173` in `backend/.env`
- Check browser console for CORS errors

### Issue: "Camera not showing"
**Fix**:
- Grant camera/mic permissions in browser
- Check if another app is using camera
- Try different browser (Chrome recommended)

### Issue: "Cannot see other participant's video"
**Fix**:
- Check both users joined same consultation ID
- Verify both have camera/mic permissions
- Check firewall/antivirus blocking WebRTC
- Try Chrome browser (best WebRTC support)

### Issue: "Authentication error"
**Fix**:
- Ensure both users are logged in
- Check JWT token in localStorage (F12 → Application → Local Storage)
- Verify user IDs match consultation record

### Issue: "Screen share not working"
**Fix**:
- Only works in HTTPS or localhost
- Check browser permissions
- Try Chrome (best support)

### Issue: "Recording upload fails"
**Fix**:
- Verify Cloudinary credentials in `backend/.env`:
  - `CLOUDINARY_CLOUD_NAME=dnvmclafv`
  - `CLOUDINARY_API_KEY=461962792668799`
  - `CLOUDINARY_API_SECRET=1SPuB0A6naxNn-65yLuqQhfUjJA`
- Check backend console for error messages

---

## 🎯 Success Criteria

### Minimum Viable Test ✅
- [ ] Single user can join video room
- [ ] Local video/audio works
- [ ] Controls (mute/video toggle) work
- [ ] No console errors

### Full Feature Test ✅
- [ ] Two users connect successfully
- [ ] Video streams in both directions
- [ ] Audio works bidirectionally
- [ ] Screen sharing works
- [ ] Chat messages send/receive
- [ ] Recording uploads to Cloudinary

---

## 📊 Test Results Template

**Date**: _______  
**Tester**: _______  
**Environment**: Development / Staging / Production

### Single User Test
- [ ] PASS / FAIL: Camera permission granted
- [ ] PASS / FAIL: Microphone permission granted
- [ ] PASS / FAIL: Local video visible
- [ ] PASS / FAIL: Connection status shows "Connected"
- [ ] PASS / FAIL: Video toggle works
- [ ] PASS / FAIL: Audio toggle works
- [ ] PASS / FAIL: Screen share button visible

### Multi-User Test
- [ ] PASS / FAIL: Second user joins successfully
- [ ] PASS / FAIL: Remote video visible
- [ ] PASS / FAIL: Audio heard from other user
- [ ] PASS / FAIL: Video toggle updates for both users
- [ ] PASS / FAIL: Chat messages received
- [ ] PASS / FAIL: Participant count correct

### Recording Test
- [ ] PASS / FAIL: Recording starts
- [ ] PASS / FAIL: Recording stops
- [ ] PASS / FAIL: File uploads to Cloudinary
- [ ] PASS / FAIL: Database record created

### Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Overall Status**: PASS / FAIL / PARTIAL

---

## 🚀 Next Steps After Testing

### If Tests Pass ✅
1. Update documentation
2. Add "Join Video Call" buttons in UI
3. Schedule user acceptance testing
4. Prepare for production deployment

### If Tests Fail ⚠️
1. Document specific errors
2. Check console logs (backend + frontend)
3. Review WebRTC connection flow
4. Fix issues and re-test

---

## 📝 Quick Reference

**Video Consultation URL Pattern**:
```
/consultation/{consultationId}/video
```

**Backend API Endpoints**:
- POST `/api/video/consultations` - Create consultation
- POST `/api/video/consultations/:id/join` - Join
- PATCH `/api/video/consultations/:id/participant` - Update settings
- POST `/api/video/consultations/:id/leave` - Leave
- POST `/api/video/consultation/:id/recording/start` - Start recording
- POST `/api/video/consultation/:id/recording/stop` - Stop recording

**WebSocket Events** (check browser console):
- `connect` - Connected to signaling server
- `participant-joined` - New user joined
- `participant-left` - User left
- `webrtc-signal` - WebRTC signaling data
- `room-message` - Chat message

**Cloudinary Recording Path**:
```
wakili-pro/video-recordings/{consultationId}/{timestamp}-{filename}
```

---

## 🎥 Video Consultation Architecture

```
┌─────────────┐         WebSocket         ┌─────────────┐
│   Client    │ ◄────────────────────────► │   Lawyer    │
│  Browser    │                             │  Browser    │
└──────┬──────┘                             └──────┬──────┘
       │                                           │
       │          WebRTC Peer-to-Peer             │
       │ ◄─────────────────────────────────────► │
       │        (Video/Audio Streams)             │
       │                                           │
       └───────────────┐   ┌───────────────────┘
                       │   │
                       ▼   ▼
               ┌───────────────────┐
               │  Signaling Server │
               │  (Socket.IO)      │
               │  Port 5000        │
               └─────────┬─────────┘
                         │
                         ▼
               ┌───────────────────┐
               │   PostgreSQL      │
               │   (Consultation   │
               │    Records)       │
               └───────────────────┘
                         │
                         ▼
               ┌───────────────────┐
               │   Cloudinary      │
               │   (Recordings)    │
               └───────────────────┘
```

**Key Technologies**:
- **WebRTC**: Peer-to-peer video/audio (simple-peer library)
- **Socket.IO**: Signaling server for WebRTC handshake
- **Cloudinary**: Video recording storage
- **PostgreSQL**: Consultation metadata

---

**🎯 READY TO TEST!**

All integration work is complete. Tomorrow just follow this guide and the system should work end-to-end. Good luck! 🚀
