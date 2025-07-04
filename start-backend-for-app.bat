@echo off
echo Starting SaptMarkets Backend Server...
cd backend
start "Backend Server" cmd /k "node server.js"
echo Backend server started in separate window
pause 