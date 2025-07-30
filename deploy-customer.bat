@echo off
echo ================================
echo   SaptMarkets Customer App Deployment
echo ================================
echo.

REM Get current directory
set "ROOT_DIR=%CD%"
echo Root directory: %ROOT_DIR%
echo.

REM Check if customer directory exists
if not exist "customer" (
    echo ❌ Customer directory not found!
    pause
    exit /b 1
)

echo ================================
echo   PREPARING CUSTOMER APP
echo ================================
echo.

REM Navigate to customer directory
cd customer

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: No .env file found!
    echo Creating .env file from env.production...
    copy env.production .env
    if errorlevel 1 (
        echo ❌ Failed to create .env file!
        pause
        exit /b 1
    )
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

REM Build the project
echo 🔨 Building the project...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Git not found, skipping git operations...
) else (
    REM Add and commit changes
    echo 📝 Committing changes...
    call git add .
    call git commit -m "Deploy customer app updates - %date% %time%"
    if errorlevel 1 (
        echo ⚠️  No changes to commit or git error
    )
)

echo.
echo ================================
echo   CUSTOMER APP READY FOR DEPLOYMENT
echo ================================
echo.
echo ✅ Customer app is ready for deployment!
echo.
echo 📋 Next Steps:
echo 1. Push to GitHub: https://github.com/saptmarkets/e-commerce_customer.git
echo 2. Deploy to Vercel: https://vercel.com
echo 3. Set environment variables on Vercel
echo 4. Test the deployed customer app
echo.
echo 🔗 Deployment Platforms:
echo - Vercel: https://vercel.com (Recommended for Next.js)
echo - Netlify: https://netlify.com
echo - Railway: https://railway.app
echo.
echo 📝 Environment Variables to set on Vercel:
echo - NEXT_PUBLIC_API_BASE_URL: https://e-commerce-backend-l0s0.onrender.com/api
echo - NEXTAUTH_SECRET: saptmarkets-customer-nextauth-secret-key-2024
echo - NEXTAUTH_URL: https://your-customer-domain.vercel.app
echo.
pause 