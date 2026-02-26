@echo off
cd /d "c:\Users\SIRPI\Desktop\assets\servoley\unified-pwa"
echo Installing dependencies...
npm install
echo.
echo Starting mock API server on port 8084...
start "Mock API Server" cmd /k "node mock-server.js"
echo Waiting for API server to start...
timeout /t 5 /nobreak > nul
echo.
echo Starting development server...
start "Dev Server" cmd /k "npm run dev"
echo.
echo Both servers are starting. Please wait a moment for them to fully initialize.
echo.
echo You can now:
echo 1. Log in as a provider with your credentials at http://localhost:5173/provider/login
echo 2. Log in as a customer/admin at http://localhost:5173/login
echo.
pause
