@echo off
echo ================================
echo   SaptMarkets Backend Deployment
echo ================================
echo.

REM Get current directory
set "ROOT_DIR=%CD%"
echo Root directory: %ROOT_DIR%
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

echo ================================
echo   DEPLOYING BACKEND
echo ================================
echo.

REM Navigate to backend directory
cd backend

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: No .env file found!
    echo Please create .env file using env.example as template.
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --production
if errorlevel 1 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

REM Run database migrations
echo 🔄 Running database migrations...
call npm run migrate:all
if errorlevel 1 (
    echo ⚠️  Warning: Database migration failed, continuing...
)

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Git not found, skipping git operations...
) else (
    REM Add and commit changes
    echo 📝 Committing changes...
    call git add .
    call git commit -m "Deploy backend updates - %date% %time%"
    if errorlevel 1 (
        echo ⚠️  No changes to commit or git error
    )
)

echo.
echo ================================
echo   BACKEND DEPLOYMENT COMPLETE
echo ================================
echo.
echo ✅ Backend is ready for deployment!
echo.
echo 📋 Next Steps:
echo 1. Push to your deployment platform (Railway, Render, Heroku)
echo 2. Set environment variables on your platform
echo 3. Monitor deployment logs
echo 4. Test API endpoints
echo.
echo 🔗 Deployment Platforms:
echo - Railway: https://railway.app
echo - Render: https://render.com
echo - Heroku: https://heroku.com
echo.
pause 