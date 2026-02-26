@echo off
echo ========================================
echo ServoLeY Development Server Starter
echo ========================================
echo.

echo Starting ServoLeY Backend Server...
echo.

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>NUL

REM Set environment variables
set NODE_ENV=development
set PORT=8086

if not exist .env (
    echo WARNING: .env not found. Configure DATABASE_URL and required secrets before starting.
)

REM Generate Prisma client first
echo Generating Prisma client...
cd /d "C:\Users\SIRPI\Desktop\assets\servoley"
npx prisma generate

REM Start backend server
echo Starting server on port 8086...
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
