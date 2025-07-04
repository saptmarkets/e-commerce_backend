@echo off
echo 🔧 Fixing SaptMarkets Physical Device Connection...
echo.

echo 📱 Step 1: Updated API configuration files
echo ✅ API service now uses IP: 192.168.0.119
echo ✅ Backend server now listens on all interfaces (0.0.0.0)
echo ✅ Windows Firewall rule added for port 5055
echo.

echo 🔄 Step 2: You need to RESTART your backend server
echo Press Ctrl+C in your backend terminal to stop it, then restart with:
echo cd backend
echo npm run dev
echo.

echo 📱 Step 3: Clean and rebuild React Native app
echo.
cd /d "SaptMarketsDeliveryApp"

echo Stopping Metro bundler...
taskkill /f /im node.exe 2>nul

echo Cleaning React Native cache...
npx react-native start --reset-cache &

timeout /t 5 >nul

echo Building app for Android...
npx react-native run-android

echo.
echo 🎉 Done! Your app should now connect to the backend.
echo.
echo 🧪 To test the connection:
echo 1. Open your browser and visit: http://192.168.0.119:5055
echo 2. You should see "API is running!"
echo 3. Try logging into your mobile app
echo.
pause 