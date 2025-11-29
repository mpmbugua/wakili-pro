#!/bin/bash
# Fix failed Prisma migrations on Render

echo "🔧 Resolving failed migrations..."

# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20251123074255_update_oauth_fields

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

echo "✅ Migrations fixed!"
