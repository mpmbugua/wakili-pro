# Render Environment Variables Setup

## Add Cloudinary Variables to Render

1. Go to: https://dashboard.render.com
2. Select your **wakili-pro-backend** service
3. Click **Environment** tab on the left
4. Click **Add Environment Variable** button

Add these three variables:

```
Name: CLOUDINARY_CLOUD_NAME
Value: dnvmclafv

Name: CLOUDINARY_API_KEY
Value: 461962792668799

Name: CLOUDINARY_API_SECRET
Value: 1SPuB0A6naxNn-65yLuqQhfUjJA
```

5. Click **Save Changes**
6. Render will automatically trigger a redeploy

## Verify Deployment

After deployment completes:
- Check build logs for "Cloudinary initialized"
- Test document upload at: https://your-domain.onrender.com/api/user-documents/upload

## Local Testing

Test locally with:
```bash
cd backend
npm run dev
```

Upload a test document via Postman or Thunder Client to:
- POST http://localhost:5000/api/user-documents/upload
- Headers: Authorization: Bearer <your-jwt-token>
- Body: form-data with 'document' file and 'title', 'type' fields
