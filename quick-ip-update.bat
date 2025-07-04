@echo off
echo ================================
echo   IP ADDRESS UPDATE HELPER
echo ================================
echo.
echo Getting current IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4 Address"') do set NEW_IP=%%a
set NEW_IP=%NEW_IP: =%
echo Current IP: %NEW_IP%
echo.
echo ================================
echo FILES TO UPDATE:
echo ================================
echo.
echo 1. PRIMARY FILES (MUST UPDATE):
echo    SaptMarketsDeliveryApp/src/config/apiConfig.js
echo    - Update API_BASE_URL to: http://%NEW_IP%:5055/api
echo    - Update SOCKET_URL to: http://%NEW_IP%:5055
echo    - Update IMAGE_BASE_URL to: http://%NEW_IP%:5055/uploads/
echo.
echo 2. ANDROID SECURITY CONFIG:
echo    SaptMarketsDeliveryApp/android/app/src/main/res/xml/network_security_config.xml
echo    - Update domain to: %NEW_IP%
echo.
echo ================================
echo AFTER UPDATING:
echo ================================
echo 1. Rebuild React Native app
echo 2. Test backend at: http://%NEW_IP%:5055
echo.
pause 