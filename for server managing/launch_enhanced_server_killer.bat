@echo off
echo ================================
echo   ENHANCED SERVER KILLER
echo ================================
echo.
echo Starting Enhanced Multi-Server Manager...
echo Features:
echo   ✅ Multiple server types (npm, React Native, Node.js)
echo   ✅ Quick start for full-stack development
echo   ✅ Dedicated logs tab with persistent viewing
echo   ✅ Better UI with icons and colors
echo   ✅ Enhanced process management
echo   ✅ Port killing functionality
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.6+ and add it to PATH.
    pause
    exit /b 1
)

REM Check if server_killer.py exists
if not exist "server_killer.py" (
    echo ❌ server_killer.py not found in current directory!
    pause
    exit /b 1
)

echo ✅ Python found, launching application...
echo.

python server_killer.py

echo.
echo Application closed.
pause 