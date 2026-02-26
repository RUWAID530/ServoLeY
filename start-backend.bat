@echo off
echo Starting Backend Server Only (Port 8084)...
echo.

cd /d "c:\Users\SIRPI\Desktop\assets\servoley"
echo Current directory: %CD%
echo.
echo Running: npm run start-server
echo.

npm run start-server

echo.
echo Backend server stopped.
echo Press any key to close this window...
pause
