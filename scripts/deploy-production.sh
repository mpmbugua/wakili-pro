#!/bin/bash

# Wakili Pro - Production Deployment Script
# This script automates the production deployment process

set -e  # Exit on any error

echo "🚀 Starting Wakili Pro Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.production .env
        print_warning "Please edit .env file with your production configuration before continuing."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Build and deploy
deploy() {
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "Starting services..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    print_status "Running health checks..."
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        docker-compose logs backend
        exit 1
    fi
    
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        docker-compose logs frontend
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Database migration
migrate_database() {
    print_status "Running database migrations..."
    docker-compose exec -T backend npx prisma migrate deploy
    print_success "Database migrations completed"
}

# Cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    echo "=========================================="
    echo "  Wakili Pro Production Deployment"
    echo "=========================================="
    
    check_prerequisites
    
    # Backup current deployment (if exists)
    if docker-compose ps -q | grep -q .; then
        print_status "Backing up current deployment..."
        docker-compose exec postgres pg_dump -U wakili wakili_pro > "backup-$(date +%Y%m%d-%H%M%S).sql" || true
    fi
    
    deploy
    migrate_database
    cleanup
    
    echo "=========================================="
    print_success "Deployment completed successfully! 🎉"
    echo "=========================================="
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Frontend: http://localhost (port 80)"
    echo "  • Backend API: http://localhost:5000"
    echo "  • Database: PostgreSQL on port 5432"
    echo "  • Redis: Available on port 6379"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Restart: docker-compose restart"
    echo "  • Stop: docker-compose down"
    echo "  • Status: docker-compose ps"
    echo ""
    echo "📚 For more information, see DEPLOYMENT.md"
}

# Handle script arguments
case "${1:-}" in
    "--check")
        check_prerequisites
        ;;
    "--migrate-only")
        migrate_database
        ;;
    "--health-check")
        print_status "Running health checks..."
        curl -f http://localhost:5000/api/health && echo "Backend: ✅"
        curl -f http://localhost/health && echo "Frontend: ✅"
        ;;
    *)
        main
        ;;
esac