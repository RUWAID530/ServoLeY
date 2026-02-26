@echo off
echo Stopping ServoLeY Server...
cd /d "C:\Users\SIRPI\Desktop\assets\servoley"

echo Stopping server...
pm2 stop servoley-server

echo Server stopped successfully!
echo.
echo Current PM2 Status:
pm2 status
echo.
pause
