@echo off
echo Setting up Service Marketplace Database...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

REM Check if we're in the correct directory
if not exist "..\package.json" (
  echo Error: Please run this script from the database directory.
  pause
  exit /b 1
)

REM Change to the root directory
cd ..

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing dependencies...
  npm install
)

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate

REM Push database schema
echo Applying database schema...
npx prisma db push

REM Run the data creation script
echo Creating sample data...
node database/create_data.js

echo.
echo Database setup completed successfully!
echo.
echo You can now start the application with: npm start
echo Or use Prisma Studio to view the database: npx prisma studio
pause
