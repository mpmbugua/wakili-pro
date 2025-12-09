# ========================================
# Wakili Pro - Render Deployment Script
# ========================================
# Automates deployment of freebies system to Render

Write-Host "`n🚀 WAKILI PRO - RENDER DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "backend/package.json")) {
    Write-Host "❌ Error: Must run from wakili-pro-dev root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Check git status
Write-Host "📋 Step 1: Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "Found uncommitted changes:" -ForegroundColor White
    $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Step 2: Confirm deployment
Write-Host "`n⚠️  Step 2: Deployment Confirmation" -ForegroundColor Yellow
Write-Host "This will deploy the freebies system to Render production environment." -ForegroundColor White
Write-Host "Database schema is already up to date (13 migrations applied)." -ForegroundColor White
$confirm = Read-Host "`nProceed with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 0
}

# Step 3: Add files to git
Write-Host "`n📦 Step 3: Adding changes to git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

# Step 4: Commit changes
Write-Host "`n💾 Step 4: Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
feat: Complete freebies system implementation

- Add 4 client one-time freebies (AI review, service request, consultation, PDF)
- Add lawyer monthly quotas (AI reviews, PDF downloads) with tier limits
- Implement phone verification (SMS via AfricasTalking)
- Add abuse prevention (multi-account detection, IP tracking)
- Create quota reset cron job (1st of month 12:01 AM)
- Build analytics tracking system (self-hosted)
- Add quota dashboard widget for lawyers
- Create UpgradePromptModal with ROI calculator
- Apply security middleware to all freebie endpoints
- Add FREE badges across UI (landing, marketplace, service selection)

Steps 1-17 complete. Schema already applied to production database.
"@

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit (or commit failed)" -ForegroundColor Yellow
}

# Step 5: Push to repository
Write-Host "`n🚢 Step 5: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "This will trigger auto-deployment on Render..." -ForegroundColor White
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Code pushed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

# Step 6: Environment variables checklist
Write-Host "`n🔐 Step 6: Environment Variables Checklist" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Please verify these environment variables are set in Render:" -ForegroundColor White
Write-Host "`n✅ REQUIRED - Olympus SMS (Phone Verification):" -ForegroundColor Green
Write-Host "   - OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW" -ForegroundColor Gray
Write-Host "   - SMS_SENDER_ID=WAKILIPRO" -ForegroundColor Gray

Write-Host "`n✅ REQUIRED - Abuse Prevention:" -ForegroundColor Green
Write-Host "   - ABUSE_DETECTION_ENABLED=true" -ForegroundColor Gray
Write-Host "   - MAX_ACCOUNTS_PER_PHONE=1" -ForegroundColor Gray
Write-Host "   - MAX_ACCOUNTS_PER_IP=5" -ForegroundColor Gray

Write-Host "`n✅ VERIFY EXISTING - Core Settings:" -ForegroundColor Green
Write-Host "   - DATABASE_URL (auto-injected by Render)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host "   - NODE_ENV=production" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL" -ForegroundColor Gray

Write-Host "`n📝 To add environment variables:" -ForegroundColor Yellow
Write-Host "1. Open Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Navigate to: wakili-pro-backend service" -ForegroundColor White
Write-Host "3. Click 'Environment' tab" -ForegroundColor White
Write-Host "4. Click 'Add Environment Variable'" -ForegroundColor White
Write-Host "5. Add each variable above" -ForegroundColor White
Write-Host "6. Click 'Save Changes' (triggers auto-redeploy)" -ForegroundColor White

# Step 7: Monitoring instructions
Write-Host "`n📊 Step 7: Monitor Deployment" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Expected logs in Render dashboard:" -ForegroundColor White
Write-Host "  ✅ Video signaling server initialized" -ForegroundColor Green
Write-Host "  ✅ [QuotaReset] Cron job initialized (runs 1st of month at 12:01 AM)" -ForegroundColor Green
Write-Host "  ✅ [AnalyticsArchive] Auto-archiving scheduled" -ForegroundColor Green
Write-Host "  ✅ Server listening on port 5000`n" -ForegroundColor Green

Write-Host "Open Render Logs:" -ForegroundColor Yellow
Write-Host "https://dashboard.render.com`n" -ForegroundColor Cyan

# Step 8: Testing checklist
Write-Host "🧪 Step 8: Post-Deployment Testing" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "After deployment completes, test these endpoints:`n" -ForegroundColor White

Write-Host "1. Health Check:" -ForegroundColor Green
Write-Host "   curl https://your-backend.onrender.com/health`n" -ForegroundColor Gray

Write-Host "2. Quota Status (requires auth):" -ForegroundColor Green
Write-Host "   curl -H 'Authorization: Bearer TOKEN' https://your-backend.onrender.com/api/quotas/status`n" -ForegroundColor Gray

Write-Host "3. Analytics Tracking (requires auth):" -ForegroundColor Green
Write-Host "   curl -X POST -H 'Authorization: Bearer TOKEN' https://your-backend.onrender.com/api/analytics/track`n" -ForegroundColor Gray

Write-Host "4. Phone Verification (requires auth):" -ForegroundColor Green
Write-Host "   curl -X POST -H 'Authorization: Bearer TOKEN' https://your-backend.onrender.com/api/verification/send-code`n" -ForegroundColor Gray

Write-Host "📖 Full testing guide: See RENDER_DEPLOYMENT_FREEBIES.md" -ForegroundColor Yellow

# Step 9: Next steps
Write-Host "`n✨ Next Steps" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "1. ✅ Code deployed to Render" -ForegroundColor Green
Write-Host "2. ⏳ Add environment variables in Render dashboard" -ForegroundColor Yellow
Write-Host "3. ⏳ Monitor deployment logs" -ForegroundColor Yellow
Write-Host "4. ⏳ Run functional tests (9 test scenarios)" -ForegroundColor Yellow
Write-Host "5. ⏳ Verify analytics events in database" -ForegroundColor Yellow
Write-Host "6. ⏳ Begin 2-month monitoring phase (Step 20)" -ForegroundColor Yellow

Write-Host "`n🎉 Deployment script complete!" -ForegroundColor Green
Write-Host "📋 See RENDER_DEPLOYMENT_FREEBIES.md for detailed instructions`n" -ForegroundColor Cyan
