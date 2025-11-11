// Quick API Test for Sprint 2 Features
console.log('🧪 Testing Wakili Pro Sprint 2 APIs...\n');

// Test 1: Backend Health Check
fetch('http://localhost:5000/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend Health:', data);
    
    // Test 2: Marketplace Search
    return fetch('http://localhost:5000/api/marketplace/services/search?limit=3');
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Marketplace Search:', {
      success: data.success,
      serviceCount: data.data?.services?.length || 0,
      message: data.message || 'OK'
    });
  })
  .catch(error => {
    console.error('❌ API Test Failed:', error.message);
  });

// Additional tests you can run in browser console:
console.log(`
🎯 Manual Testing Instructions:

1. AUTHENTICATION FLOW:
   - Click "Sign Up" button
   - Select "LAWYER" role
   - Complete registration form
   - Login with created credentials

2. LAWYER PROFILE:
   - Complete onboarding form
   - Add specializations (try multiple)
   - Set location and bio
   - Save profile

3. SERVICE CREATION:
   - Navigate to "Create Service"
   - Select service type (try CONSULTATION)
   - Set price (e.g., 5000 KES)
   - Add description and tags
   - Create service

4. MOBILE TESTING:
   - Open http://192.168.100.4:3000 on mobile device
   - Test touch interactions
   - Verify responsive design
   - Complete same flows as desktop

5. API TESTING:
   - Open browser DevTools (F12)
   - Run this script in Console tab
   - Check Network tab for API calls
   - Verify no CORS or authentication errors
`);

export {};