@echo off
echo Checking current IP address...
echo.
ipconfig | findstr "IPv4 Address"
echo.
echo Current config file uses: 192.168.100.119
echo.
echo If IP has changed, update SaptMarketsDeliveryApp/src/config/apiConfig.js
pause 