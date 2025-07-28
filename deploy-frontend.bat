@echo off
echo ================================
echo   SaptMarkets Frontend Deployment
echo ================================
echo.

REM Get current directory
set "ROOT_DIR=%CD%"
echo Root directory: %ROOT_DIR%
echo.

echo ================================
echo   DEPLOYING FRONTEND APPS
echo ================================
echo.

REM Deploy Customer Store
echo 🛒 Deploying Customer Store...
if exist "customer" (
    cd customer
    
    REM Check if .env.local file exists
    if not exist ".env.local" (
        echo ⚠️  Warning: No .env.local file found!
        echo Please create .env.local file using env.example as template.
        echo.
    )
    
    REM Install dependencies
    echo 📦 Installing customer store dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install customer store dependencies!
        cd ..
        pause
        exit /b 1
    )
    
    REM Build the application
    echo 🔨 Building customer store...
    call npm run build
    if errorlevel 1 (
        echo ❌ Failed to build customer store!
        cd ..
        pause
        exit /b 1
    )
    
    echo ✅ Customer store build completed!
    cd ..
) else (
    echo ❌ Customer directory not found!
)

echo.

REM Deploy Admin Dashboard
echo 🎛️ Deploying Admin Dashboard...
if exist "admin" (
    cd admin
    
    REM Check if .env file exists
    if not exist ".env" (
        echo ⚠️  Warning: No .env file found!
        echo Please create .env file using env.example as template.
        echo.
    )
    
    REM Install dependencies
    echo 📦 Installing admin dashboard dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install admin dashboard dependencies!
        cd ..
        pause
        exit /b 1
    )
    
    REM Build the application
    echo 🔨 Building admin dashboard...
    call npm run build
    if errorlevel 1 (
        echo ❌ Failed to build admin dashboard!
        cd ..
        pause
        exit /b 1
    )
    
    echo ✅ Admin dashboard build completed!
    cd ..
) else (
    echo ❌ Admin directory not found!
)

echo.
echo ================================
echo   FRONTEND DEPLOYMENT COMPLETE
echo ================================
echo.
echo ✅ Frontend apps are ready for deployment!
echo.
echo 📋 Next Steps:
echo 1. Push to your deployment platform (Vercel, Netlify)
echo 2. Set environment variables on your platform
echo 3. Configure custom domains if needed
echo 4. Test all applications
echo.
echo 🔗 Deployment Platforms:
echo - Vercel: https://vercel.com
echo - Netlify: https://netlify.com
echo.
echo 📱 Mobile App:
echo - Build Android APK: cd SaptMarketsDeliveryApp && npx react-native run-android
echo - iOS: Use Xcode to build and upload to App Store Connect
echo.
pause 