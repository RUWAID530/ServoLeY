@echo off
echo Checking Node.js and npm...
node --version
npm --version

echo.
echo Checking if we're in the right directory...
cd

echo.
echo Checking if package.json exists...
if exist package.json (
    echo package.json found
) else (
    echo package.json NOT found
)

echo.
echo Checking if node_modules exists...
if exist node_modules (
    echo node_modules found
) else (
    echo node_modules NOT found
)

echo.
echo Trying to start the server...
npm run dev
pause
