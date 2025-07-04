@echo off
echo ================================
echo   STARTING ALL SERVERS
echo ================================
echo.

REM Get current directory
set "ROOT_DIR=%CD%"
echo Root directory: %ROOT_DIR%
echo.

REM Check if required directories exist
if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

if not exist "SaptMarketsDeliveryApp" (
    echo ❌ SaptMarketsDeliveryApp directory not found!
    pause
    exit /b 1
)

echo ================================
echo   LAUNCHING TERMINALS...
echo ================================
echo.

REM 1. Start Backend Server (Node.js)
echo 1. Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%ROOT_DIR%\backend" && echo Starting Backend Server on port 5055... && node api/index.js"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM 2. Start React Native Metro Bundler
echo 2. Starting React Native Metro Bundler...
start "React Native Metro" cmd /k "cd /d "%ROOT_DIR%\SaptMarketsDeliveryApp" && echo Starting React Native Metro Bundler... && npx react-native start --reset-cache"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM 3. Start Android App (optional)
echo 3. Do you want to start the Android app? (y/n)
choice /c yn /n /m "Start Android app? (y/n): "
if errorlevel 2 goto :skip_android
if errorlevel 1 goto :start_android

:start_android
echo Starting Android App...
start "Android App" cmd /k "cd /d "%ROOT_DIR%\SaptMarketsDeliveryApp" && echo Starting Android App... && echo Make sure you have an Android device connected or emulator running... && npx react-native run-android"
goto :done

:skip_android
echo Skipping Android app startup.

:done
echo.
echo ================================
echo   ALL SERVERS STARTED!
echo ================================
echo.
echo Terminals opened:
echo 1. 🖥️  Backend Server (port 5055)
echo 2. 📱 React Native Metro Bundler (port 8081)
if errorlevel 1 echo 3. 🤖 Android App
echo.
echo Backend will be available at: http://localhost:5055
echo Metro bundler at: http://localhost:8081
echo.
echo ✅ All services are starting up...
echo Close this window when done.
echo.
pause 