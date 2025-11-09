# 🚀 Wakili Pro Sprint 2 Testing Guide

## 🌐 **Web Application Testing**
**URL:** http://localhost:3000

### ✅ **Available Test Features:**

#### 1. **User Authentication System**
- **Registration:** Create new user accounts with email/password
- **Login:** Access existing accounts with JWT token authentication
- **Role Selection:** Choose between PUBLIC user and LAWYER roles
- **Email Verification:** Mock verification system for user accounts

#### 2. **Lawyer Profile Management** 
- **Onboarding Flow:** Complete lawyer profile setup (requires LAWYER role)
- **Professional Credentials:** License number, year of admission, experience
- **Specializations:** Multiple legal specialization categories
- **Location Setup:** County/city location with coordinate mapping
- **Bio & Portfolio:** Professional description and credentials upload

#### 3. **Marketplace Service Creation**
- **Service Types:** 6 available types (Consultation, Document Drafting, Legal Review, IP Filing, Dispute Mediation, Contract Negotiation)  
- **Pricing Configuration:** Set KES pricing with duration settings
- **Service Description:** Detailed service descriptions with tag management
- **Tag System:** Up to 10 custom tags per service for discoverability

#### 4. **Service Discovery & Search**
- **Public Search:** Browse services without authentication
- **Filter Options:** Filter by type, location, price range, rating
- **Service Details:** View detailed service information and lawyer profiles
- **Pagination:** Browse through multiple pages of results

## 📱 **Mobile Testing Setup**

### **Network Access:**
- **Local URL:** http://localhost:3000 (desktop only)
- **Network URL:** http://192.168.100.4:3000 (mobile accessible)

### **Mobile Device Instructions:**
1. **Same Network:** Ensure mobile device is on same WiFi network
2. **Access URL:** Open browser and navigate to http://192.168.100.4:3000
3. **Test Responsive:** Verify mobile-responsive design and touch interactions
4. **Cross-Platform:** Test all features work identically on mobile

### **Mobile Emulator Options:**
- **Chrome DevTools:** F12 → Device Toolbar → Select mobile device
- **Firefox Responsive:** F12 → Responsive Design Mode
- **Android Studio:** Use Android emulator with browser
- **iOS Simulator:** Use Xcode simulator (Mac only)

## 🧪 **API Testing Endpoints**

### **Public Endpoints (No Auth Required):**
```
GET /health - Backend health check
GET /api/marketplace/services/search - Search services  
GET /api/marketplace/services/:id - Get service details
```

### **Protected Endpoints (Auth Required):**
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/lawyers/profile - Get lawyer profile
PUT /api/lawyers/profile - Update lawyer profile  
POST /api/marketplace/services - Create service (LAWYER role)
GET /api/marketplace/my-services - Get my services (LAWYER role)
```

## 📋 **Test Scenarios**

### **Scenario 1: New Lawyer Onboarding**
1. ✅ Register new account with LAWYER role
2. ✅ Complete lawyer profile setup form
3. ✅ Add specializations and location
4. ✅ Create first marketplace service
5. ✅ Verify service appears in search results

### **Scenario 2: Service Marketplace**
1. ✅ Browse services as public user
2. ✅ Search and filter services  
3. ✅ View service details and lawyer profiles
4. ✅ Test responsive design on mobile
5. ✅ Verify service booking flow (future Sprint 3)

### **Scenario 3: Cross-Platform Testing**
1. ✅ Test web version on desktop browser
2. ✅ Test mobile version via network URL  
3. ✅ Compare functionality across devices
4. ✅ Verify UI/UX consistency
5. ✅ Test touch interactions and mobile navigation

## 🔧 **Development Server Status**

- ✅ **Frontend:** http://localhost:3000 (Web) / http://192.168.100.4:3000 (Mobile)
- ✅ **Backend:** http://localhost:5000 (API)
- ✅ **Database:** PostgreSQL with Prisma ORM
- ✅ **Authentication:** JWT-based with role management
- ✅ **Mobile Access:** Network host enabled for cross-device testing

## 🎯 **Expected Test Results**

### **Working Features:**
- User registration and authentication  
- Lawyer profile management and onboarding
- Service creation with all 6 service types
- Service search and filtering
- Responsive mobile design
- API endpoints responding correctly

### **Known Limitations (Sprint 3 Features):**
- Payment integration (M-Pesa/Stripe)
- Real-time chat system
- Service booking completion
- Push notifications
- Advanced analytics

## 🐛 **Troubleshooting**

### **Common Issues:**
- **Port 5000 in use:** Kill node processes and restart
- **Mobile access fails:** Check WiFi network and IP address
- **API errors:** Verify backend server is running on port 5000
- **Database errors:** Ensure PostgreSQL is running and Prisma is generated

### **Debug Commands:**
```powershell
# Kill existing processes
Get-Process -Name "node" | Stop-Process -Force

# Restart servers  
npm run dev

# Test backend health
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Check network IP
ipconfig | findstr IPv4
```

Happy Testing! 🚀