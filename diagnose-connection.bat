@echo off
echo 🔍 SaptMarkets Connection Diagnostics
echo =====================================
echo.

echo 📍 Step 1: Checking your computer's IP address...
ipconfig | findstr "IPv4"
echo.

echo 🌐 Step 2: Testing if backend server is running...
curl -s http://localhost:5055 -m 3 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend server is running on localhost
) else (
    echo ❌ Backend server is NOT running on localhost
)
echo.

echo 📱 Step 3: Testing external network access...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4" ^| findstr "192.168"') do (
    set "ip=%%a"
    goto :found
)
:found
set ip=%ip: =%
echo Testing: http://%ip%:5055
curl -s http://%ip%:5055 -m 3 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend accessible from network at %ip%:5055
) else (
    echo ❌ Backend NOT accessible from network
    echo.
    echo 🔧 Possible issues:
    echo - Windows Firewall blocking port 5055
    echo - Antivirus blocking connections
    echo - Backend server not listening on all interfaces
    echo - Different network subnet
)
echo.

echo 🧪 Step 4: Testing mobile API endpoint...
curl -s http://%ip%:5055/api/mobile-delivery/health -m 3 2>nul
if %errorlevel% equ 0 (
    echo ✅ Mobile API endpoint responding
) else (
    echo ❌ Mobile API endpoint not responding
)
echo.

echo 🔑 Step 5: Testing login endpoint...
curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"driver@saptmarkets.com\",\"password\":\"driver123\"}" http://%ip%:5055/api/mobile-delivery/login -m 5 2>nul
if %errorlevel% equ 0 (
    echo ✅ Login endpoint working
) else (
    echo ❌ Login endpoint not working
)
echo.

echo 📋 Summary:
echo Your computer IP: %ip%
echo Backend URL: http://%ip%:5055
echo Mobile API: http://%ip%:5055/api/mobile-delivery
echo.
echo 📱 FOR YOUR PHONE TO CONNECT:
echo 1. Phone and computer must be on SAME WiFi network
echo 2. Use IP: %ip% in your app configuration
echo 3. Temporarily disable Windows Firewall to test
echo 4. Check if antivirus is blocking connections
echo.
pause 