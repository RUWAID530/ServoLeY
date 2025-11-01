@echo off
echo Starting all applications...

:: Start the server
echo Starting server on port 8083...
start "Server" cmd /k "cd /d %~dp0 && node server.js"

:: Start customer PWA
echo Starting customer PWA...
start "Customer PWA" cmd /k "cd /d %~dp0\customer-pwa && npm run dev"

:: Start provider PWA
echo Starting provider PWA...
start "Provider PWA" cmd /k "cd /d %~dp0\provider-pwa && npm run dev"

echo All applications are starting in separate windows...
pause