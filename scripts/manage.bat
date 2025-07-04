@echo off
REM 🛒 SaptMarkets Management Script for Windows - Because every marketplace needs a manager! 🛒

setlocal enabledelayedexpansion

REM Project info
set PROJECT_NAME=SaptMarkets
set PROJECT_DIR=%~dp0..
set BACKEND_DIR=%PROJECT_DIR%\backend
set ADMIN_DIR=%PROJECT_DIR%\admin

REM Colors (Windows 10+ supports ANSI colors)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set PURPLE=[95m
set CYAN=[96m
set NC=[0m

REM Emojis
set SHOP=🛒
set ROCKET=🚀
set GEAR=⚙️
set TEST=🧪
set CLEAN=🧹
set INFO=📊
set CHECK=✅
set CROSS=❌
set SPARKLE=✨
set DATABASE=🗄️
set SYNC=🔄

REM Helper functions
:print_header
echo.
echo %CYAN%%SHOP% %~1 %SHOP%%NC%
echo.
goto :eof

:print_success
echo %GREEN%%CHECK% %~1%NC%
goto :eof

:print_error
echo %RED%%CROSS% %~1%NC%
goto :eof

:print_info
echo %BLUE%%INFO% %~1%NC%
goto :eof

:print_warning
echo %YELLOW%⚠️  %~1%NC%
goto :eof

REM Check if command exists
:command_exists
where %~1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Check if Node.js is installed
:check_node
call :command_exists node
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed! Please install Node.js first."
    exit /b 1
)
call :print_info "Node.js version: "
node --version
exit /b 0

REM Check if MongoDB is running
:check_mongodb
call :command_exists mongod
if %errorlevel% neq 0 (
    call :print_warning "MongoDB not found in PATH. Make sure MongoDB is installed and running."
    exit /b 1
)

tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% equ 0 (
    call :print_success "MongoDB is running"
    exit /b 0
) else (
    call :print_warning "MongoDB is not running. Please start MongoDB first."
    exit /b 1
)

REM Install dependencies
:install
call :print_header "Installing dependencies %GEAR%"
call :check_node
if %errorlevel% neq 0 exit /b 1

call :print_info "Installing backend dependencies..."
cd /d "%BACKEND_DIR%"
call npm install

call :print_info "Installing admin frontend dependencies..."
cd /d "%ADMIN_DIR%"
call npm install

call :print_success "All dependencies installed! Ready to rock! %ROCKET%"
goto :eof

REM Start backend server
:start_backend
call :print_header "Starting Backend Server %ROCKET%"
call :check_node
if %errorlevel% neq 0 exit /b 1
call :check_mongodb

cd /d "%BACKEND_DIR%"

if exist ".env" (
    call :print_info "Environment file found"
) else (
    call :print_warning "No .env file found. Please create one from .env-template"
)

call :print_info "Starting backend server on port 5055..."
call npm start
goto :eof

REM Start admin frontend
:start_admin
call :print_header "Starting Admin Frontend %ROCKET%"
call :check_node
if %errorlevel% neq 0 exit /b 1

cd /d "%ADMIN_DIR%"
call :print_info "Starting admin frontend on port 3000..."
call npm run dev
goto :eof

REM Start both servers
:start_all
call :print_header "Starting All Services %ROCKET%"
call :print_info "Starting backend and admin servers..."

cd /d "%BACKEND_DIR%"
start "Backend Server" cmd /k "npm start"

timeout /t 3 /nobreak >nul

cd /d "%ADMIN_DIR%"
start "Admin Frontend" cmd /k "npm run dev"

call :print_success "Both servers started in separate windows!"
call :print_info "Use 'manage.bat stop' to stop all servers"
goto :eof

REM Stop all servers
:stop
call :print_header "Stopping All Services %CLEAN%"

taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    call :print_success "All Node.js processes stopped"
) else (
    call :print_warning "No Node.js processes found to stop"
)

call :print_success "All services stopped! %CHECK%"
goto :eof

REM Test multi-unit promotions
:test_promotions
call :print_header "Testing Multi-Unit Promotions %TEST%"
call :check_node
if %errorlevel% neq 0 exit /b 1
call :check_mongodb

cd /d "%BACKEND_DIR%"
call :print_info "Running multi-unit promotion test..."
node test-multi-unit-promotions.js
goto :eof

REM Import promotions
:import_promotions
call :print_header "Importing Promotions from Odoo %SYNC%"
call :check_node
if %errorlevel% neq 0 exit /b 1
call :check_mongodb

cd /d "%BACKEND_DIR%"

if "%~1"=="" (
    call :print_info "Importing all pending promotions..."
    node -e "const OdooImportService = require('./services/odooImportService'); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets').then(() => OdooImportService.importPromotions()).then(result => { console.log('Import result:', result); process.exit(0); }).catch(err => { console.error('Import failed:', err); process.exit(1); });"
) else (
    call :print_info "Importing specific promotion items: %~1"
    node -e "const OdooImportService = require('./services/odooImportService'); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets').then(() => OdooImportService.importPromotions([%~1])).then(result => { console.log('Import result:', result); process.exit(0); }).catch(err => { console.error('Import failed:', err); process.exit(1); });"
)
goto :eof

REM Database operations
:db_status
call :print_header "Database Status %DATABASE%"
call :check_mongodb
if %errorlevel% equ 0 (
    cd /d "%BACKEND_DIR%"
    call :print_info "Checking database collections..."
    node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets').then(() => mongoose.connection.db.listCollections().toArray()).then(collections => { console.log('Collections:', collections.map(c => c.name).join(', ')); process.exit(0); }).catch(err => { console.error('Database check failed:', err); process.exit(1); });"
)
goto :eof

REM Show project status
:status
call :print_header "Project Status %INFO%"
echo %PURPLE%Project:%NC% %PROJECT_NAME%
echo %PURPLE%Location:%NC% %PROJECT_DIR%
echo %PURPLE%Backend:%NC% %BACKEND_DIR%
echo %PURPLE%Admin:%NC% %ADMIN_DIR%

call :command_exists node
if %errorlevel% equ 0 (
    echo %PURPLE%Node.js:%NC% 
    node --version
    echo %PURPLE%NPM:%NC% 
    npm --version
) else (
    echo %PURPLE%Node.js:%NC% Not installed
)

call :check_mongodb
if %errorlevel% equ 0 (
    echo %PURPLE%MongoDB:%NC% Running
) else (
    echo %PURPLE%MongoDB:%NC% Not running
)

echo.
echo %PURPLE%Git status:%NC%
call :command_exists git
if %errorlevel% equ 0 (
    git status --short 2>nul || echo   Clean working tree %CHECK%
) else (
    echo   Not a git repository
)
goto :eof

REM Show help
:show_help
call :print_header "SaptMarkets Management Help %INFO%"
echo %CYAN%Available commands:%NC%
echo   %GREEN%install%NC%          - Install all dependencies
echo   %GREEN%start-backend%NC%     - Start backend server only
echo   %GREEN%start-admin%NC%       - Start admin frontend only
echo   %GREEN%start-all%NC%         - Start both backend and admin servers
echo   %GREEN%stop%NC%              - Stop all running servers
echo   %GREEN%test-promotions%NC%   - Test multi-unit promotion functionality
echo   %GREEN%import-promotions%NC% - Import promotions from Odoo (optionally with item IDs)
echo   %GREEN%db-status%NC%         - Check database status
echo   %GREEN%status%NC%            - Show project status
echo   %GREEN%help%NC%              - Show this help message

echo.
echo %CYAN%Examples:%NC%
echo   %YELLOW%manage.bat install%NC%
echo   %YELLOW%manage.bat start-all%NC%
echo   %YELLOW%manage.bat test-promotions%NC%
echo   %YELLOW%manage.bat import-promotions 123,456,789%NC%
goto :eof

REM Main command dispatcher
if "%~1"=="" goto show_help

if "%~1"=="install" goto install
if "%~1"=="start-backend" goto start_backend
if "%~1"=="start-admin" goto start_admin
if "%~1"=="start-all" goto start_all
if "%~1"=="stop" goto stop
if "%~1"=="test-promotions" goto test_promotions
if "%~1"=="import-promotions" goto import_promotions
if "%~1"=="db-status" goto db_status
if "%~1"=="status" goto status
if "%~1"=="help" goto show_help
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help

call :print_error "Unknown command: %~1"
echo.
goto show_help 