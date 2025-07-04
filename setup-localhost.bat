@echo off
echo ================================
echo   LOCALHOST CONFIGURATION SETUP
echo ================================
echo.

echo Setting up all apps to use localhost...
echo.

REM 1. React Native app is already updated to use 10.0.2.2
echo 1. ✅ React Native: Already configured for emulator (10.0.2.2:5055)

REM 2. Create admin .env file
echo 2. Setting up Admin app...
echo VITE_APP_API_BASE_URL=http://localhost:5055/api > admin\.env
echo    ✅ Created admin/.env with localhost configuration

REM 3. Create customer .env.local file  
echo 3. Setting up Customer app...
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:5055/api > customer\.env.local
echo    ✅ Created customer/.env.local with localhost configuration

REM 4. Backend already uses localhost by default
echo 4. ✅ Backend: Uses localhost by default

REM 5. Add delivery driver to database
echo 5. Adding delivery driver to database...
node add-delivery-driver.js
echo    ✅ Delivery driver credentials added

echo.
echo ================================
echo   CONFIGURATION COMPLETE!
echo ================================
echo.
echo 📱 React Native Delivery App: http://10.0.2.2:5055/api
echo 🌐 Customer App: http://localhost:5055/api  
echo ⚡ Admin App: http://localhost:5055/api
echo 🚀 Backend Server: http://localhost:5055
echo.
echo ================================
echo   TEST LOGIN CREDENTIALS
echo ================================
echo.
echo Delivery App Login:
echo   Email: driver@saptmarkets.com
echo   Password: password123
echo.
echo Admin Login:
echo   Email: admin@example.com
echo   Password: password123  
echo.
echo.
pause 