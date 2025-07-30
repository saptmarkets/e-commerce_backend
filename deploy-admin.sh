#!/bin/bash

echo "🚀 Preparing SAPT Markets Admin App for Deployment..."

# Navigate to admin directory
cd admin

# Remove node_modules if it exists
echo "📦 Cleaning up node_modules..."
rm -rf node_modules

# Remove dist folder if it exists
echo "🗂️ Cleaning up dist folder..."
rm -rf dist

# Remove any existing git repository
echo "🔧 Removing existing git repository..."
rm -rf .git

# Initialize new git repository
echo "📝 Initializing new git repository..."
git init

# Add all files except those in .gitignore
echo "📁 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: SAPT Markets Admin App"

# Add remote repository
echo "🔗 Adding remote repository..."
git remote add origin https://github.com/saptmarkets/e-commerce_admin.git

# Push to main branch
echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Admin app successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/saptmarkets/e-commerce_admin.git"
echo ""
echo "📋 Next Steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Import the repository: saptmarkets/e-commerce_admin"
echo "4. Configure environment variables"
echo "5. Deploy!" 