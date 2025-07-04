#!/usr/bin/env bash
# 🛒 SaptMarkets Management Script - Because every marketplace needs a manager! 🛒

set -euo pipefail

# Colors for our fancy output
if [[ -t 1 ]] && [[ "${NO_COLOR:-}" != "1" ]]; then
    RED=$'\033[0;31m'
    GREEN=$'\033[0;32m'
    YELLOW=$'\033[1;33m'
    BLUE=$'\033[0;34m'
    PURPLE=$'\033[0;35m'
    CYAN=$'\033[0;36m'
    NC=$'\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    NC=''
fi

# Project info
PROJECT_NAME="SaptMarkets"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
ADMIN_DIR="$PROJECT_DIR/admin"

# Non-interactive mode flag
NON_INTERACTIVE=${NON_INTERACTIVE:-false}

# Emojis for fun (can be disabled)
if [[ "${NO_EMOJI:-}" == "1" ]]; then
    SHOP="[SHOP]"
    ROCKET="[GO]"
    GEAR="[BUILD]"
    TEST="[TEST]"
    CLEAN="[CLEAN]"
    INFO="[INFO]"
    CHECK="[OK]"
    CROSS="[FAIL]"
    SPARKLE="[*]"
    DATABASE="[DB]"
    SYNC="[SYNC]"
else
    SHOP="🛒"
    ROCKET="🚀"
    GEAR="⚙️"
    TEST="🧪"
    CLEAN="🧹"
    INFO="📊"
    CHECK="✅"
    CROSS="❌"
    SPARKLE="✨"
    DATABASE="🗄️"
    SYNC="🔄"
fi

# Helper functions
print_header() {
    echo -e "\n${CYAN}${SHOP} $1 ${SHOP}${NC}\n"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
check_node() {
    if ! command_exists node; then
        print_error "Node.js is not installed! Please install Node.js first."
        exit 1
    fi
    print_info "Node.js version: $(node --version)"
}

# Check if MongoDB is running
check_mongodb() {
    if ! command_exists mongod; then
        print_warning "MongoDB not found in PATH. Make sure MongoDB is installed and running."
        return 1
    fi
    
    if pgrep -x "mongod" > /dev/null; then
        print_success "MongoDB is running"
        return 0
    else
        print_warning "MongoDB is not running. Please start MongoDB first."
        return 1
    fi
}

# Install dependencies
install() {
    print_header "Installing dependencies ${GEAR}"
    
    check_node
    
    print_info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    
    print_info "Installing admin frontend dependencies..."
    cd "$ADMIN_DIR"
    npm install
    
    print_success "All dependencies installed! Ready to rock! ${ROCKET}"
}

# Start backend server
start_backend() {
    print_header "Starting Backend Server ${ROCKET}"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    if [[ -f ".env" ]]; then
        print_info "Environment file found"
    else
        print_warning "No .env file found. Please create one from .env-template"
    fi
    
    print_info "Starting backend server on port 5055..."
    npm start
}

# Start admin frontend
start_admin() {
    print_header "Starting Admin Frontend ${ROCKET}"
    
    check_node
    
    cd "$ADMIN_DIR"
    
    print_info "Starting admin frontend on port 3000..."
    npm run dev
}

# Start both servers
start_all() {
    print_header "Starting All Services ${ROCKET}"
    
    print_info "Starting backend and admin servers..."
    
    # Start backend in background
    cd "$BACKEND_DIR"
    npm start &
    BACKEND_PID=$!
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start admin in background
    cd "$ADMIN_DIR"
    npm run dev &
    ADMIN_PID=$!
    
    print_success "Backend PID: $BACKEND_PID"
    print_success "Admin PID: $ADMIN_PID"
    print_info "Use './manage.sh stop' to stop all servers"
    
    # Wait for both processes
    wait $BACKEND_PID $ADMIN_PID
}

# Stop all servers
stop() {
    print_header "Stopping All Services ${CLEAN}"
    
    # Kill Node.js processes
    if pgrep -f "node.*start-server.js" > /dev/null; then
        pkill -f "node.*start-server.js"
        print_success "Backend server stopped"
    fi
    
    if pgrep -f "node.*vite" > /dev/null; then
        pkill -f "node.*vite"
        print_success "Admin frontend stopped"
    fi
    
    print_success "All services stopped! ${CHECK}"
}

# Test multi-unit promotions
test_promotions() {
    print_header "Testing Multi-Unit Promotions ${TEST}"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    print_info "Running multi-unit promotion test..."
    node test-multi-unit-promotions.js
}

# Import promotions
import_promotions() {
    print_header "Importing Promotions from Odoo ${SYNC}"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    local item_ids="${1:-}"
    
    if [[ -n "$item_ids" ]]; then
        print_info "Importing specific promotion items: $item_ids"
        node -e "
        const OdooImportService = require('./services/odooImportService');
        const mongoose = require('mongoose');
        
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets')
            .then(() => OdooImportService.importPromotions([$item_ids]))
            .then(result => {
                console.log('Import result:', result);
                process.exit(0);
            })
            .catch(err => {
                console.error('Import failed:', err);
                process.exit(1);
            });
        "
    else
        print_info "Importing all pending promotions..."
        node -e "
        const OdooImportService = require('./services/odooImportService');
        const mongoose = require('mongoose');
        
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets')
            .then(() => OdooImportService.importPromotions())
            .then(result => {
                console.log('Import result:', result);
                process.exit(0);
            })
            .catch(err => {
                console.error('Import failed:', err);
                process.exit(1);
            });
        "
    fi
}

# Analyze root cause
analyze_root_cause() {
    print_header "Analyzing Root Cause 🔍"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    print_info "Running root cause analysis..."
    node analyze-root-cause.js
}

# Repair data consistency
repair_data() {
    print_header "Repairing Data Consistency 🔧"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    print_info "Running data consistency repair..."
    node repair-data-consistency.js
}

# Monitor data health
monitor_health() {
    print_header "Monitoring Data Health 🏥"
    
    check_node
    check_mongodb
    
    cd "$BACKEND_DIR"
    
    print_info "Running data health monitor..."
    node monitor-data-health.js
}

# Database operations
db_status() {
    print_header "Database Status ${DATABASE}"
    
    if check_mongodb; then
        cd "$BACKEND_DIR"
        
        print_info "Checking database collections..."
        node -e "
        const mongoose = require('mongoose');
        
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets')
            .then(() => mongoose.connection.db.listCollections().toArray())
            .then(collections => {
                console.log('Collections:', collections.map(c => c.name).join(', '));
                process.exit(0);
            })
            .catch(err => {
                console.error('Database check failed:', err);
                process.exit(1);
            });
        "
    fi
}

# Show project status
status() {
    print_header "Project Status ${INFO}"
    
    echo -e "${PURPLE}Project:${NC} $PROJECT_NAME"
    echo -e "${PURPLE}Location:${NC} $PROJECT_DIR"
    echo -e "${PURPLE}Backend:${NC} $BACKEND_DIR"
    echo -e "${PURPLE}Admin:${NC} $ADMIN_DIR"
    
    if command_exists node; then
        echo -e "${PURPLE}Node.js:${NC} $(node --version)"
        echo -e "${PURPLE}NPM:${NC} $(npm --version)"
    else
        echo -e "${PURPLE}Node.js:${NC} Not installed"
    fi
    
    if check_mongodb; then
        echo -e "${PURPLE}MongoDB:${NC} Running"
    else
        echo -e "${PURPLE}MongoDB:${NC} Not running"
    fi
    
    echo -e "\n${PURPLE}Git status:${NC}"
    if command_exists git && git rev-parse --git-dir > /dev/null 2>&1; then
        git status --short || echo "  Clean working tree ${CHECK}"
    else
        echo "  Not a git repository"
    fi
}

# Show help
show_help() {
    print_header "SaptMarkets Management Help ${INFO}"
    
    echo -e "${CYAN}Available commands:${NC}"
    echo -e "  ${GREEN}install${NC}          - Install all dependencies"
    echo -e "  ${GREEN}start-backend${NC}     - Start backend server only"
    echo -e "  ${GREEN}start-admin${NC}       - Start admin frontend only"
    echo -e "  ${GREEN}start-all${NC}         - Start both backend and admin servers"
    echo -e "  ${GREEN}stop${NC}              - Stop all running servers"
    echo -e "  ${GREEN}test-promotions${NC}   - Test multi-unit promotion functionality"
    echo -e "  ${GREEN}import-promotions${NC} - Import promotions from Odoo (optionally with item IDs)"
    echo -e "  ${GREEN}analyze-root-cause${NC} - Analyze root cause of import issues"
    echo -e "  ${GREEN}repair-data${NC}       - Repair data consistency issues"
    echo -e "  ${GREEN}monitor-health${NC}    - Monitor data health status"
    echo -e "  ${GREEN}db-status${NC}         - Check database status"
    echo -e "  ${GREEN}status${NC}            - Show project status"
    echo -e "  ${GREEN}help${NC}              - Show this help message"
    
    echo -e "\n${CYAN}Examples:${NC}"
    echo -e "  ${YELLOW}./manage.sh install${NC}"
    echo -e "  ${YELLOW}./manage.sh start-all${NC}"
    echo -e "  ${YELLOW}./manage.sh test-promotions${NC}"
    echo -e "  ${YELLOW}./manage.sh import-promotions 123,456,789${NC}"
    echo -e "  ${YELLOW}./manage.sh analyze-root-cause${NC}"
    echo -e "  ${YELLOW}./manage.sh repair-data${NC}"
    echo -e "  ${YELLOW}./manage.sh monitor-health${NC}"
}

# Main command dispatcher
case "${1:-help}" in
    install)
        install
        ;;
    start-backend)
        start_backend
        ;;
    start-admin)
        start_admin
        ;;
    start-all)
        start_all
        ;;
    stop)
        stop
        ;;
    test-promotions)
        test_promotions
        ;;
    import-promotions)
        import_promotions "${2:-}"
        ;;
    analyze-root-cause)
        analyze_root_cause
        ;;
    repair-data)
        repair_data
        ;;
    monitor-health)
        monitor_health
        ;;
    db-status)
        db_status
        ;;
    status)
        status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac 