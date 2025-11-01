@echo off
echo Starting ServoLeY Application in Development Mode...
echo =====================================

REM Update API_BASE in frontend
powershell -Command "(Get-Content customer-pwa\src\App.tsx) -replace 'export const API_BASE = .*', 'export const API_BASE = \'http://localhost:8080\'' | Set-Content customer-pwa\src\App.tsx"
echo Updated API_BASE to http://localhost:8080

REM Update CORS in backend
powershell -Command "(Get-Content server.js) -replace 'origin:.*\[.*\]', 'origin: process.env.CORS_ORIGIN?.split(\',\') || [\'http://localhost:8080\', \'http://localhost:8081\']'' | Set-Content server.js"
echo Updated CORS to include http://localhost:8081

REM Create a development environment file with bypass OTP
echo NODE_ENV=development > .env.dev
echo DATABASE_URL="postgresql://MOHAMMED RUWAIH:RUWAITH123@localhost:5432/servoley_db" >> .env.dev
echo JWT_SECRET="your-super-secret-jwt-key-786786" >> .env.dev
echo JWT_EXPIRES_IN="7d" >> .env.dev
echo OTP_EXPIRES_IN="300" >> .env.dev
echo OTP_LENGTH="6" >> .env.dev
echo BYPASS_OTP=true >> .env.dev
echo PORT=8080 >> .env.dev

REM Start backend server with development environment
echo Starting backend server on port 8080...
start cmd /k "cd /d %~dp0 && set NODE_ENV=development && set BYPASS_OTP=true && set PORT=8080 && node server.js"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend server
echo Starting frontend server on port 8081...
start cmd /k "cd /d %~dp0\customer-pwa && npm run dev -- --port 8081"

echo =====================================
echo Servers are starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:8081
echo =====================================
echo.
echo IMPORTANT: OTP verification is bypassed in development mode
echo Any 6-digit code will work for verification
echo.
echo Press any key to exit...
pause >nul
