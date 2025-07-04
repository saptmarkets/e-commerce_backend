# Smart Tree Installation Script for Windows
# This script downloads and installs Smart Tree (st) from GitHub

Write-Host "Smart Tree Installation Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Create tools directory if it doesn't exist
$toolsDir = "$env:USERPROFILE\.cursor\tools"
if (!(Test-Path $toolsDir)) {
    Write-Host "Creating tools directory: $toolsDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

# Check if Rust/Cargo is installed
Write-Host "`nChecking for Rust installation..." -ForegroundColor Yellow
try {
    $cargoVersion = cargo --version 2>&1
    Write-Host "Found: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "Rust/Cargo not found. Installing Rust..." -ForegroundColor Yellow
    Write-Host "Please visit https://rustup.rs/ to install Rust" -ForegroundColor Cyan
    Write-Host "After installing Rust, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Install Smart Tree using cargo
Write-Host "`nInstalling Smart Tree using cargo..." -ForegroundColor Yellow
try {
    cargo install smart-tree --force
    Write-Host "Smart Tree installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error installing Smart Tree: $_" -ForegroundColor Red
    exit 1
}

# Get cargo bin directory
$cargoBin = "$env:USERPROFILE\.cargo\bin"

# Add to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$cargoBin*") {
    Write-Host "Adding cargo bin to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$cargoBin", "User")
    $env:Path = "$env:Path;$cargoBin"
    Write-Host "Cargo bin added to PATH!" -ForegroundColor Green
} else {
    Write-Host "Cargo bin already in PATH" -ForegroundColor Cyan
}

# Test the installation
Write-Host "`nTesting Smart Tree installation..." -ForegroundColor Yellow
try {
    st --version
    Write-Host "Smart Tree is ready to use!" -ForegroundColor Green
} catch {
    Write-Host "Smart Tree installed but may require a terminal restart to use 'st' command" -ForegroundColor Yellow
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "You can now use 'st' command in any terminal." -ForegroundColor Cyan
Write-Host "Note: You may need to restart your terminal for PATH changes to take effect." -ForegroundColor Yellow

# Show some example commands
Write-Host "`nExample Smart Tree commands:" -ForegroundColor Cyan
Write-Host "  st                    # Show directory tree" -ForegroundColor White
Write-Host "  st -m ai              # AI-optimized output" -ForegroundColor White
Write-Host "  st -m hex             # Hexadecimal format" -ForegroundColor White
Write-Host "  st -m markdown        # Markdown documentation" -ForegroundColor White
Write-Host "  st --help             # Show all options" -ForegroundColor White 