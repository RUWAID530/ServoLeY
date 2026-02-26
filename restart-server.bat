@echo off
echo Restarting ServoLeY Server...
cd /d "C:\Users\SIRPI\Desktop\assets\servoley"

echo Restarting server...
pm2 restart servoley-server

echo Server restarted successfully!
echo.
echo Server Status:
pm2 status
echo.
pause
