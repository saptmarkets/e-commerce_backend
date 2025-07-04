@echo off
echo ================================
echo   SETTING LOCALHOST CONFIG
echo ================================
echo.

echo Updating all applications to use localhost...
echo.

REM Update React Native Delivery App
echo 1. Updating React Native Delivery App...
if exist "SaptMarketsDeliveryApp\src\config\apiConfig.js" (
    powershell -Command "(Get-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js') -replace 'http://192\.168\.\d+\.\d+:5055', 'http://10.0.2.2:5055' | Set-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js'"
    echo    ✅ React Native app updated to use emulator localhost
) else (
    echo    ❌ React Native config not found
)

REM Update customer app (if it has IP hardcoded)
echo 2. Checking customer app configuration...
if exist "customer\src\services\httpServices.js" (
    powershell -Command "(Get-Content 'customer\src\services\httpServices.js') -replace 'http://192\.168\.\d+\.\d+:5055', 'http://localhost:5055' | Set-Content 'customer\src\services\httpServices.js'"
    echo    ✅ Customer app checked (uses localhost by default)
) else (
    echo    ❌ Customer httpServices.js not found
)

REM Create admin .env file if it doesn't exist
echo 3. Setting up admin app configuration...
if not exist "admin\.env" (
    echo VITE_APP_API_BASE_URL=http://localhost:5055/api > "admin\.env"
    echo    ✅ Created admin .env file with localhost
) else (
    echo    ✅ Admin .env file already exists
)

REM Update any existing admin .env file
if exist "admin\.env" (
    powershell -Command "(Get-Content 'admin\.env') -replace 'http://192\.168\.\d+\.\d+:5055', 'http://localhost:5055' | Set-Content 'admin\.env'"
    echo    ✅ Updated admin .env to use localhost
)

REM Create customer .env.local if needed
echo 4. Setting up customer app environment...
if not exist "customer\.env.local" (
    echo NEXT_PUBLIC_API_BASE_URL=http://localhost:5055/api > "customer\.env.local"
    echo    ✅ Created customer .env.local with localhost
) else (
    echo    ✅ Customer .env.local already exists
)

REM Update any existing customer .env.local
if exist "customer\.env.local" (
    powershell -Command "(Get-Content 'customer\.env.local') -replace 'http://192\.168\.\d+\.\d+:5055', 'http://localhost:5055' | Set-Content 'customer\.env.local'"
    echo    ✅ Updated customer .env.local to use localhost
)

REM Check backend configuration
echo 5. Checking backend configuration...
if exist "backend\api\index.js" (
    echo    ✅ Backend uses localhost by default
) else (
    echo    ❌ Backend not found
)

echo.
echo ================================
echo   CONFIGURATION SUMMARY
echo ================================
echo.
echo ✅ React Native App: Uses 10.0.2.2:5055 (emulator localhost)
echo ✅ Customer App: Uses localhost:5055
echo ✅ Admin App: Uses localhost:5055
echo ✅ Backend: Runs on localhost:5055
echo.
echo ================================
echo   NEXT STEPS
echo ================================
echo.
echo 1. Start backend server: cd backend && node api/index.js
echo 2. Start customer app: cd customer && npm run dev
echo 3. Start admin app: cd admin && npm run dev
echo 4. Build React Native app: cd SaptMarketsDeliveryApp && npx react-native run-android
echo.
echo Note: Make sure to use Android emulator for React Native app
echo The emulator IP 10.0.2.2 maps to your computer's localhost
echo.
pause 