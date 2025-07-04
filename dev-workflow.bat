@echo off
echo ================================
echo   COMPLETE DEV WORKFLOW
echo ================================
echo.

echo 1. Checking IP address and updating configs...
call auto-update-ip.bat

echo.
echo ================================
echo   STARTING DEVELOPMENT SERVERS
echo ================================
echo.

echo Do you want to start all servers now? (y/n)
choice /c yn /n /m "Start servers? (y/n): "
if errorlevel 2 goto :manual_start
if errorlevel 1 goto :auto_start

:auto_start
call start-all-servers.bat
goto :end

:manual_start
echo.
echo To start servers manually, run:
echo   start-all-servers.bat
echo.

:end
echo.
echo ================================
echo   DEVELOPMENT READY!
echo ================================
echo.
pause 