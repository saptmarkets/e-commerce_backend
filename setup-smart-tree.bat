@echo off
echo ========================================
echo Smart Tree Setup Guide for Windows
echo ========================================
echo.

echo Smart Tree requires Rust to be installed on your system.
echo.

where cargo >nul 2>nul
if %errorlevel% == 0 (
    echo [OK] Rust is already installed!
    echo.
    echo Installing Smart Tree...
    cargo install smart-tree
    echo.
    echo Installation complete! You can now use 'st' command.
    echo Try running: st --help
) else (
    echo [!] Rust is not installed on your system.
    echo.
    echo Please follow these steps:
    echo.
    echo 1. Visit: https://www.rust-lang.org/tools/install
    echo 2. Download and run: rustup-init.exe
    echo 3. Follow the installation prompts
    echo 4. After installation, restart this terminal
    echo 5. Run this script again to install Smart Tree
    echo.
    echo Press any key to open the Rust installation page...
    pause >nul
    start https://www.rust-lang.org/tools/install
)

echo.
pause 