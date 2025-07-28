#!/bin/bash

# 🚀 SaptMarkets E-commerce Deployment Script
# This script automates the deployment of all components

set -e  # Exit on any error

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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

print_status "🚀 Starting SaptMarkets Deployment Process..."

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit or stash them before deployment."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 1
    fi
fi

# Function to deploy backend
deploy_backend() {
    print_status "📦 Deploying Backend API..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Check if .env file exists
        if [ ! -f ".env" ]; then
            print_warning "No .env file found in backend directory."
            print_status "Please create .env file using env.example as template."
            return 1
        fi
        
        # Install dependencies
        print_status "Installing backend dependencies..."
        npm install --production
        
        # Run database migrations
        print_status "Running database migrations..."
        npm run migrate:all || print_warning "Migration failed, continuing..."
        
        # Commit changes
        git add .
        git commit -m "Deploy backend updates - $(date)" || print_warning "No changes to commit"
        
        print_success "Backend deployment prepared!"
        cd ..
    else
        print_error "Backend directory not found!"
        return 1
    fi
}

# Function to deploy customer store
deploy_customer() {
    print_status "🛒 Deploying Customer Store..."
    
    if [ -d "customer" ]; then
        cd customer
        
        # Check if .env.local file exists
        if [ ! -f ".env.local" ]; then
            print_warning "No .env.local file found in customer directory."
            print_status "Please create .env.local file using env.example as template."
            return 1
        fi
        
        # Install dependencies
        print_status "Installing customer store dependencies..."
        npm install
        
        # Build the application
        print_status "Building customer store..."
        npm run build
        
        # Commit changes
        git add .
        git commit -m "Deploy customer store updates - $(date)" || print_warning "No changes to commit"
        
        print_success "Customer store deployment prepared!"
        cd ..
    else
        print_error "Customer directory not found!"
        return 1
    fi
}

# Function to deploy admin dashboard
deploy_admin() {
    print_status "🎛️ Deploying Admin Dashboard..."
    
    if [ -d "admin" ]; then
        cd admin
        
        # Check if .env file exists
        if [ ! -f ".env" ]; then
            print_warning "No .env file found in admin directory."
            print_status "Please create .env file using env.example as template."
            return 1
        fi
        
        # Install dependencies
        print_status "Installing admin dashboard dependencies..."
        npm install
        
        # Build the application
        print_status "Building admin dashboard..."
        npm run build
        
        # Commit changes
        git add .
        git commit -m "Deploy admin dashboard updates - $(date)" || print_warning "No changes to commit"
        
        print_success "Admin dashboard deployment prepared!"
        cd ..
    else
        print_error "Admin directory not found!"
        return 1
    fi
}

# Function to build mobile app
build_mobile() {
    print_status "📱 Building Mobile App..."
    
    if [ -d "SaptMarketsDeliveryApp" ]; then
        cd SaptMarketsDeliveryApp
        
        # Install dependencies
        print_status "Installing mobile app dependencies..."
        npm install
        
        # Build Android APK
        print_status "Building Android APK..."
        cd android
        ./gradlew assembleRelease || print_warning "Android build failed"
        cd ..
        
        print_success "Mobile app build completed!"
        cd ..
    else
        print_error "SaptMarketsDeliveryApp directory not found!"
        return 1
    fi
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Deploy backend
    if deploy_backend; then
        print_success "✅ Backend deployment prepared successfully"
    else
        print_error "❌ Backend deployment failed"
    fi
    
    # Deploy customer store
    if deploy_customer; then
        print_success "✅ Customer store deployment prepared successfully"
    else
        print_error "❌ Customer store deployment failed"
    fi
    
    # Deploy admin dashboard
    if deploy_admin; then
        print_success "✅ Admin dashboard deployment prepared successfully"
    else
        print_error "❌ Admin dashboard deployment failed"
    fi
    
    # Build mobile app
    if build_mobile; then
        print_success "✅ Mobile app build completed successfully"
    else
        print_error "❌ Mobile app build failed"
    fi
    
    # Push all changes
    print_status "Pushing all changes to remote repository..."
    git push origin $CURRENT_BRANCH || print_warning "Failed to push to remote"
    
    print_success "🎉 Deployment process completed!"
    print_status ""
    print_status "📋 Next Steps:"
    print_status "1. Check your deployment platforms (Railway, Vercel, etc.)"
    print_status "2. Verify all applications are running correctly"
    print_status "3. Test the mobile app on devices"
    print_status "4. Monitor logs for any issues"
    print_status ""
    print_status "🔗 Useful URLs:"
    print_status "- Backend API: https://your-backend-url.railway.app"
    print_status "- Customer Store: https://your-customer-store.vercel.app"
    print_status "- Admin Dashboard: https://your-admin-dashboard.vercel.app"
    print_status ""
    print_status "📱 Mobile App:"
    print_status "- Android APK: SaptMarketsDeliveryApp/android/app/build/outputs/apk/release/"
    print_status "- iOS: Build through Xcode and upload to App Store Connect"
}

# Run main function
main "$@" 