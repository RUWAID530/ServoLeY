@echo off
echo =====================================
echo  ServoLeY Backend Diagnostic Tool
echo =====================================

REM Check Node.js installation
echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH
    echo Please install Node.js and add it to PATH
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo Checking if PostgreSQL is running...
netstat -an | findstr :5432 > nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not running on port 5432
    echo Please start PostgreSQL service
    pause
    exit /b 1
) else (
    echo PostgreSQL is running on port 5432
)

REM Do not overwrite .env
if not exist .env (
    echo WARNING: .env file not found. Database tests may fail without DATABASE_URL.
)

REM Test database connection
echo Testing database connection...
node test-db-connection.js
if %errorlevel% neq 0 (
    echo Database connection test failed
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

REM Start simple server first
echo Starting simple test server...
cd /d %~dp0
start cmd /k "node server-simple.js"
echo Simple server started at http://localhost:8080
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Test simple server
echo Testing simple server...
curl -s http://localhost:8080/api/health
if %errorlevel% neq 0 (
    echo Failed to connect to simple server
    pause
    exit /b 1
) else (
    echo Simple server is working correctly
)

REM Start full server
echo Starting full server with database connection...
start cmd /k "node server.js"
echo Full server started at http://localhost:8080
echo Waiting for server to initialize...
timeout /t 5 /nobreak >nul

REM Test full server
echo Testing full server...
curl -s http://localhost:8080/api/health
if %errorlevel% neq 0 (
    echo Failed to connect to full server
    pause
    exit /b 1
) else (
    echo Full server is working correctly
)

echo =====================================
echo All tests completed successfully
echo Servers are running:
echo - Simple test server: http://localhost:8080
echo - Full backend server: http://localhost:8080
echo =====================================
echo.
echo Press any key to exit...
pause >nul
