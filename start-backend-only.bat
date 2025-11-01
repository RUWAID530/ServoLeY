@echo off
echo =====================================
echo  Starting Backend Server Only
echo =====================================

REM Set up environment variables
set NODE_ENV=development
set BYPASS_OTP=true
set PORT=8080

REM Create environment file
echo NODE_ENV=development > .env
echo DATABASE_URL="postgresql://MOHAMMED RUWAIH:RUWAITH123@localhost:5432/servoley_db" >> .env
echo JWT_SECRET="your-super-secret-jwt-key-786786" >> .env
echo JWT_EXPIRES_IN="7d" >> .env
echo OTP_EXPIRES_IN="300" >> .env
echo OTP_LENGTH="6" >> .env
echo BYPASS_OTP=true >> .env
echo PORT=8080 >> .env

REM Check if PostgreSQL is running
echo Checking if PostgreSQL is running...
netstat -an | findstr :5432 > nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running on port 5432
    echo Please start PostgreSQL service and try again
    pause
    exit /b 1
)

REM Check if port 8080 is available
echo Checking if port 8080 is available...
netstat -an | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo Port 8080 is already in use
    echo Stopping any existing processes on port 8080...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a
    timeout /t 2 /nobreak >nul
)

REM Start backend server
echo Starting backend server...
echo =====================================
cd /d %~dp0
node server.js

echo =====================================
echo Backend server stopped
echo Press any key to exit...
pause >nul
