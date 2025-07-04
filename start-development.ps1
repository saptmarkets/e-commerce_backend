# SaptMarkets Development Startup Script

Write-Host "Starting SaptMarkets development environment..." -ForegroundColor Green

# Start the backend server
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./backend && npm run dev"

Write-Host "Backend server started in a new window" -ForegroundColor Green
Write-Host "The server is running at http://localhost:5055" -ForegroundColor Green

Write-Host "`nTo start the React Native app, please run this command in a new terminal:" -ForegroundColor Yellow
Write-Host "cd SaptMarketsDeliveryApp && npm start" -ForegroundColor White
Write-Host "Then in another terminal run:" -ForegroundColor Yellow
Write-Host "cd SaptMarketsDeliveryApp && npm run android" -ForegroundColor White

Write-Host "`nImportant: Make sure your Android emulator is running before executing npm run android" -ForegroundColor Magenta 