@echo off
echo 🧹 Clearing ALL Cache and Rebuilding App
echo =========================================
echo.

echo 📱 Step 1: Stopping all React Native processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im adb.exe 2>nul
echo.

echo 🗑️ Step 2: Clearing React Native cache...
npx react-native start --reset-cache --clear-cache &
timeout /t 3 >nul
taskkill /f /im node.exe 2>nul
echo.

echo 🗑️ Step 3: Clearing npm cache...
npm cache clean --force
echo.

echo 🗑️ Step 4: Clearing Gradle cache...
cd android
.\gradlew clean
.\gradlew cleanBuildCache
echo.

echo 🗑️ Step 5: Clearing Android build cache...
rd /s /q build 2>nul
rd /s /q app\build 2>nul
rd /s /q .gradle 2>nul
cd ..
echo.

echo 🗑️ Step 6: Clearing Metro cache...
rd /s /q "C:\Users\%USERNAME%\AppData\Local\Temp\metro-cache" 2>nul
rd /s /q "C:\Users\%USERNAME%\AppData\Local\Temp\react-native" 2>nul
echo.

echo 🔄 Step 7: Starting fresh Metro bundler...
start cmd /k "npx react-native start --reset-cache"
timeout /t 5 >nul
echo.

echo 🔨 Step 8: Building and installing fresh app...
npx react-native run-android --reset-cache
echo.

echo ✅ Done! Your app should now use the latest configuration.
echo.
echo 📱 On your phone, also:
echo 1. Go to Settings > Apps > SaptMarkets Delivery App
echo 2. Force Stop the app
echo 3. Clear Storage AND Clear Cache
echo 4. Restart the app
echo.
pause 