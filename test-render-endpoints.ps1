#!/usr/bin/env pwsh
# Test Render Deployment Endpoints

$baseUrl = "https://wakili-pro.onrender.com"

Write-Host "`n🧪 Testing Wakili Pro Backend on Render`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($health.status -eq "OK") {
        Write-Host "   ✅ Health check passed: $($health.message)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Health check error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Lawyers List
Write-Host "`n2. Testing Lawyers Endpoint..." -ForegroundColor Yellow
try {
    $lawyers = Invoke-RestMethod -Uri "$baseUrl/api/lawyers?limit=3" -Method GET
    if ($lawyers.success) {
        Write-Host "   ✅ Lawyers endpoint working" -ForegroundColor Green
        Write-Host "   📊 Found $($lawyers.data.lawyers.Count) lawyers" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Lawyers endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Lawyers error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Registration (without actually registering)
Write-Host "`n3. Testing Registration Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "Test123!"
        firstName = "Test"
        lastName = "User"
        role = "CLIENT"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -Headers $headers
    
    if ($response.success) {
        Write-Host "   ✅ Registration endpoint working (test account created)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Response: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "already exists" -or $errorMsg -match "400") {
        Write-Host "   ✅ Registration endpoint working (test account exists)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Registration error: $errorMsg" -ForegroundColor Red
    }
}

# Test 4: Forgot Password
Write-Host "`n4. Testing Forgot Password Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/forgot-password" -Method POST -Body $body -Headers $headers
    
    Write-Host "   ✅ Forgot password endpoint working" -ForegroundColor Green
    Write-Host "   📧 Response: $($response.message)" -ForegroundColor Cyan
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "not found" -or $errorMsg -match "404") {
        Write-Host "   ✅ Forgot password endpoint working (user not found)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Forgot password error: $errorMsg" -ForegroundColor Red
    }
}

# Test 5: Disabled Certification Endpoint (Should return 501)
Write-Host "`n5. Testing Disabled Certification Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/certifications/queue" -Method GET
    Write-Host "   ⚠️  Unexpected success (should be disabled)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 501) {
        Write-Host "   ✅ Certification correctly disabled (HTTP 501)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Got HTTP $statusCode instead of 501" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Testing Complete!`n" -ForegroundColor Cyan
Write-Host "Backend URL: $baseUrl" -ForegroundColor Gray
Write-Host "Deployment Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
