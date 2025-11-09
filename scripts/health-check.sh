#!/bin/bash

# Wakili Pro - Health Check Script
# Comprehensive health monitoring for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null; then
        print_success "$name is healthy ($url)"
        return 0
    else
        print_error "$name is unhealthy ($url)"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local container=$1
    local status=$(docker-compose ps -q "$container" 2>/dev/null)
    
    if [ -n "$status" ]; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$status" 2>/dev/null || echo "no-health-check")
        local running=$(docker inspect --format='{{.State.Running}}' "$status" 2>/dev/null || echo "false")
        
        if [ "$running" = "true" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "no-health-check" ]; then
                print_success "$container container is running"
                return 0
            else
                print_error "$container container is unhealthy (health: $health)"
                return 1
            fi
        else
            print_error "$container container is not running"
            return 1
        fi
    else
        print_error "$container container not found"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    print_status "Checking database connectivity..."
    
    if docker-compose exec -T postgres pg_isready -U wakili -d wakili_pro > /dev/null 2>&1; then
        print_success "Database is accessible"
        
        # Check table count
        local tables=$(docker-compose exec -T postgres psql -U wakili -d wakili_pro -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d '[:space:]')
        print_status "Database has $tables tables"
        
        return 0
    else
        print_error "Database is not accessible"
        return 1
    fi
}

# Function to check Redis
check_redis() {
    print_status "Checking Redis connectivity..."
    
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is accessible"
        return 0
    else
        print_warning "Redis is not accessible (optional service)"
        return 0  # Don't fail for Redis as it's optional
    fi
}

# Function to check disk space
check_disk_space() {
    print_status "Checking disk space..."
    
    local usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        print_error "Disk usage is critically high: ${usage}%"
        return 1
    elif [ "$usage" -gt 80 ]; then
        print_warning "Disk usage is high: ${usage}%"
    else
        print_success "Disk usage is normal: ${usage}%"
    fi
    
    return 0
}

# Function to check memory usage
check_memory() {
    print_status "Checking memory usage..."
    
    local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    local mem_int=${mem_usage%.*}
    
    if [ "$mem_int" -gt 90 ]; then
        print_error "Memory usage is critically high: ${mem_usage}%"
        return 1
    elif [ "$mem_int" -gt 80 ]; then
        print_warning "Memory usage is high: ${mem_usage}%"
    else
        print_success "Memory usage is normal: ${mem_usage}%"
    fi
    
    return 0
}

# Main health check function
main() {
    echo "=========================================="
    echo "  Wakili Pro Health Check Report"
    echo "  $(date)"
    echo "=========================================="
    echo ""
    
    local overall_status=0
    
    # Container checks
    print_status "Checking Docker containers..."
    check_container "postgres" || overall_status=1
    check_container "redis" || true  # Redis is optional
    check_container "backend" || overall_status=1
    check_container "frontend" || overall_status=1
    echo ""
    
    # Service connectivity checks
    print_status "Checking service connectivity..."
    check_database || overall_status=1
    check_redis || true  # Redis is optional
    echo ""
    
    # HTTP endpoint checks
    print_status "Checking HTTP endpoints..."
    check_http "http://localhost:5000/api/health" "Backend API" || overall_status=1
    check_http "http://localhost/health" "Frontend" || overall_status=1
    echo ""
    
    # System resource checks
    print_status "Checking system resources..."
    check_disk_space || overall_status=1
    check_memory || overall_status=1
    echo ""
    
    # Docker stats
    if [ "$(docker-compose ps -q | wc -l)" -gt 0 ]; then
        print_status "Docker resource usage:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        echo ""
    fi
    
    # Summary
    echo "=========================================="
    if [ $overall_status -eq 0 ]; then
        print_success "Overall system health: HEALTHY 🟢"
        echo "All critical services are operational."
    else
        print_error "Overall system health: UNHEALTHY 🔴"
        echo "One or more critical services have issues."
        echo "Check the logs above for details."
    fi
    echo "=========================================="
    
    return $overall_status
}

# Handle script arguments
case "${1:-}" in
    "--backend")
        check_http "http://localhost:5000/api/health" "Backend API"
        ;;
    "--frontend")
        check_http "http://localhost/health" "Frontend"
        ;;
    "--database")
        check_database
        ;;
    "--redis")
        check_redis
        ;;
    "--containers")
        check_container "postgres"
        check_container "backend"
        check_container "frontend"
        ;;
    "--resources")
        check_disk_space
        check_memory
        ;;
    "--quick")
        print_status "Quick health check..."
        check_http "http://localhost:5000/api/health" "Backend" 5
        check_http "http://localhost/health" "Frontend" 5
        ;;
    *)
        main
        ;;
esac