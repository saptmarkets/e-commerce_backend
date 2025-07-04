@echo off
setlocal enabledelayedexpansion

echo ================================
echo   AUTO IP ADDRESS UPDATER
echo ================================
echo.

REM Get current IP address
echo Getting current IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 Address" ^| findstr "192.168"') do (
    set "NEW_IP=%%a"
    set "NEW_IP=!NEW_IP: =!"
    goto :found_ip
)

:found_ip
if "%NEW_IP%"=="" (
    echo ❌ Could not detect IP address!
    pause
    exit /b 1
)

echo ✅ Current IP: %NEW_IP%
echo.

REM Backup original files (optional)
echo Creating backups...
if exist "SaptMarketsDeliveryApp\src\config\apiConfig.js" (
    copy "SaptMarketsDeliveryApp\src\config\apiConfig.js" "SaptMarketsDeliveryApp\src\config\apiConfig.js.backup" >nul 2>&1
)

echo.
echo ================================
echo   UPDATING FILES...
echo ================================

REM Update apiConfig.js
echo 1. Updating apiConfig.js...
if exist "SaptMarketsDeliveryApp\src\config\apiConfig.js" (
    powershell -Command "(Get-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js') -replace 'http://192\.168\.\d+\.\d+:5055/api', 'http://%NEW_IP%:5055/api' | Set-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js'"
    powershell -Command "(Get-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js') -replace 'http://192\.168\.\d+\.\d+:5055;', 'http://%NEW_IP%:5055;' | Set-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js'"
    powershell -Command "(Get-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js') -replace 'http://192\.168\.\d+\.\d+:5055/uploads/', 'http://%NEW_IP%:5055/uploads/' | Set-Content 'SaptMarketsDeliveryApp\src\config\apiConfig.js'"
    echo    ✅ apiConfig.js updated
) else (
    echo    ❌ apiConfig.js not found
)

REM Update network security config
echo 2. Updating network_security_config.xml...
if exist "SaptMarketsDeliveryApp\android\app\src\main\res\xml\network_security_config.xml" (
    powershell -Command "(Get-Content 'SaptMarketsDeliveryApp\android\app\src\main\res\xml\network_security_config.xml') -replace '192\.168\.\d+\.\d+', '%NEW_IP%' | Set-Content 'SaptMarketsDeliveryApp\android\app\src\main\res\xml\network_security_config.xml'"
    echo    ✅ network_security_config.xml updated
) else (
    echo    ❌ network_security_config.xml not found
)

REM Update IP reference file
echo 3. Updating ip.txt...
if exist "SaptMarketsDeliveryApp\android\app\src\main\res\raw\ip.txt" (
    echo %NEW_IP% > "SaptMarketsDeliveryApp\android\app\src\main\res\raw\ip.txt"
    echo    ✅ ip.txt updated
) else (
    echo    ❌ ip.txt not found
)

echo.
echo ================================
echo   UPDATE COMPLETE!
echo ================================
echo ✅ All files updated to IP: %NEW_IP%
echo.
echo NEXT STEPS:
echo 1. Rebuild React Native app
echo 2. Test backend at: http://%NEW_IP%:5055
echo.
pause 