@echo off
echo ================================
echo   DEBUG SERVER KILLER
echo ================================
echo.
echo Running debug version to identify issues...
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.6+ and add it to PATH.
    pause
    exit /b 1
)

echo ✅ Python found, running debug version...
echo.

REM Run the debug version
python debug_server_killer.py

echo.
echo Debug session ended.
pause 