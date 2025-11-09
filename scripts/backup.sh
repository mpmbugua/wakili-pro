#!/bin/bash

# Wakili Pro - Backup Script
# Creates backups of database and application files

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d-%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/database-backup-$DATE.sql"
APP_BACKUP_FILE="$BACKUP_DIR/application-backup-$DATE.tar.gz"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "  Wakili Pro Backup Process"
echo "=========================================="

# Database backup
print_status "Creating database backup..."
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U wakili wakili_pro > "$DB_BACKUP_FILE"
    print_success "Database backup saved to: $DB_BACKUP_FILE"
else
    print_status "PostgreSQL container not running, skipping database backup"
fi

# Application backup
print_status "Creating application backup..."
tar -czf "$APP_BACKUP_FILE" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=build \
    --exclude=.git \
    --exclude=logs \
    --exclude=uploads \
    --exclude=backups \
    .

print_success "Application backup saved to: $APP_BACKUP_FILE"

# Cleanup old backups (keep last 7 days)
print_status "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "=========================================="
print_success "Backup process completed! 🎉"
echo "=========================================="

# List recent backups
print_status "Recent backups:"
ls -lah "$BACKUP_DIR" | tail -10