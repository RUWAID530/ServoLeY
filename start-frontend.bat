@echo off
echo Starting Frontend Server Only (Port 5174)...
echo.

cd /d "c:\Users\SIRPI\Desktop\assets\servoley\unified-pwa"
echo Current directory: %CD%
echo.
echo Running: npm run dev
echo.

npm run dev

echo.
echo Frontend server stopped.
echo Press any key to close this window...
pause
