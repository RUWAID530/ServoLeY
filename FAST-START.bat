@echo off
echo ========================================
echo ServoLeY Development Server Starter
echo ========================================
echo.

echo [1/5] Killing existing processes...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Setting environment variables...
set PORT=8086
set NODE_ENV=development

echo [3/5] Starting backend server...
cd /d "c:\Users\SIRPI\Desktop\assets\servoley"
start "Backend Server" cmd /k "echo Backend Server Running on port 8086 & node server.js"

echo [4/5] Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [5/5] Starting frontend server...
cd /d "c:\Users\SIRPI\Desktop\assets\servoley\unified-pwa"
start "Frontend Server" cmd /k "echo Frontend Server Running & npm run dev"

echo.
echo ========================================
echo 🚀 SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo Backend:  http://localhost:8086
echo Frontend: http://localhost:5174
echo Admin:    http://localhost:5174/admin/login
echo Provider: http://localhost:5174/provider/login
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5174/provider/login

echo.
echo ✅ Development environment ready!
echo Both servers will stay running in separate windows.
echo Close this window when done.
pause
