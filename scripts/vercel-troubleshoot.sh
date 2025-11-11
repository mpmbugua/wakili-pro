#!/bin/bash
# Vercel GitHub Actions Troubleshooting Script

echo "🔍 Vercel Configuration Diagnostics"
echo "=================================="
echo ""

echo "📋 Expected GitHub Secrets:"
echo "VERCEL_TOKEN: vercel_xxxxxxxxxx"
echo "VERCEL_ORG_ID: team_JGrb0SdhRZ3K2W1mnCPAFkom"  
echo "VERCEL_PROJECT_ID: prj_3pFNy227EbDTPtz0TlDcWPYk6W8o"
echo ""

echo "🔧 Local Vercel CLI Status:"
vercel whoami 2>/dev/null || echo "❌ Not logged in"
echo ""

echo "📊 Project Configuration:"
if [ -f ".vercel/project.json" ]; then
    echo "✅ Project linked"
    cat .vercel/project.json | jq '.' 2>/dev/null || cat .vercel/project.json
else
    echo "❌ Project not linked"
fi
echo ""

echo "🚀 Test Commands:"
echo "1. Create new token: https://vercel.com/account/tokens"
echo "2. Update GitHub secret: https://github.com/mpmbugua/wakili-pro/settings/secrets/actions"
echo "3. Test local deploy: vercel --prod"
echo ""

echo "🔍 Common Issues:"
echo "- Token expired or invalid"
echo "- Wrong project/org IDs in GitHub secrets"
echo "- Token doesn't have sufficient permissions"
echo "- Network/firewall blocking Vercel API"