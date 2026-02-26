@echo off
echo Starting ServoLey Development Environment...
echo.

echo Starting Backend Server (Port 8084)...
cd /d "c:\Users\SIRPI\Desktop\assets\servoley"
start cmd /k "npm run start-server"

echo Waiting for backend to start...
timeout /t 10

echo Starting Frontend Server (Port 5174)...
cd /d "c:\Users\SIRPI\Desktop\assets\servoley\unified-pwa"
start cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8084
echo Frontend: http://localhost:5174
echo.
echo Press any key to close this window...
pause
