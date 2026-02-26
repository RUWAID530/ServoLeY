@echo off
setlocal
echo Starting ServoLeY application in development mode...
echo =====================================

cd /d %~dp0

REM Do not modify repository files or .env from this launcher.
if not exist .env (
  echo WARNING: .env not found in project root.
  echo Create .env before running the backend.
)

if not exist unified-pwa (
  echo ERROR: unified-pwa folder not found.
  pause
  exit /b 1
)

echo Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run start-server"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d %~dp0\unified-pwa && npm run dev"

echo =====================================
echo Servers started in separate windows.
echo Backend:  http://localhost:8084 (or your .env PORT)
echo Frontend: http://localhost:5174 (Vite default in this project)
echo =====================================
echo.
echo Press any key to exit...
pause >nul
