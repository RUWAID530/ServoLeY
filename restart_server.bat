@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo Starting server on port 8083...
cd /d "%~dp0"
node server.js
pause