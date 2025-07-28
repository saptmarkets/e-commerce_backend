@echo off
echo ================================
echo   SaptMarkets Mobile App Build
echo ================================
echo.

REM Get current directory
set "ROOT_DIR=%CD%"
echo Root directory: %ROOT_DIR%
echo.

REM Check if mobile app directory exists
if not exist "SaptMarketsDeliveryApp" (
    echo ❌ SaptMarketsDeliveryApp directory not found!
    pause
    exit /b 1
)

echo ================================
echo   BUILDING MOBILE APP
echo ================================
echo.

REM Navigate to mobile app directory
cd SaptMarketsDeliveryApp

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in SaptMarketsDeliveryApp!
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing mobile app dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install mobile app dependencies!
    pause
    exit /b 1
)

REM Check if Android directory exists
if not exist "android" (
    echo ❌ Android directory not found!
    echo Please ensure React Native Android setup is complete.
    pause
    exit /b 1
)

REM Build Android APK
echo 🤖 Building Android APK...
cd android

REM Check if gradlew exists
if not exist "gradlew" (
    echo ❌ gradlew not found!
    echo Please ensure Android setup is complete.
    cd ..
    pause
    exit /b 1
)

REM Make gradlew executable (if on Unix-like system)
gradlew assembleRelease
if errorlevel 1 (
    echo ❌ Failed to build Android APK!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ================================
echo   MOBILE APP BUILD COMPLETE
echo ================================
echo.
echo ✅ Android APK built successfully!
echo.
echo 📱 APK Location:
echo SaptMarketsDeliveryApp\android\app\build\outputs\apk\release\app-release.apk
echo.
echo 📋 Next Steps:
echo 1. Test the APK on Android devices
echo 2. Sign the APK for production release
echo 3. Upload to Google Play Console
echo 4. For iOS: Use Xcode to build and upload to App Store Connect
echo.
echo 🔗 Useful Links:
echo - Google Play Console: https://play.google.com/console
echo - App Store Connect: https://appstoreconnect.apple.com
echo.
echo 📝 Signing APK for Production:
echo 1. Generate keystore: keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
echo 2. Configure signing in android/app/build.gradle
echo 3. Build signed APK: gradlew assembleRelease
echo.
pause 