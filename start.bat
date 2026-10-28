@echo off
title GymFlow Launcher
echo ===================================================
echo   Starting GymFlow (Backend + Frontend)
echo ===================================================

echo [1/2] Launching Backend Server (Connecting to MongoDB)...
start "GymFlow Backend Server" cmd /k "cd /d "%~dp0server" && npm start"

echo [2/2] Launching Frontend Client...
start "GymFlow Frontend Client" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ===================================================
echo   GymFlow is launching!
echo   - Backend & MongoDB: http://localhost:5000
echo   - Frontend Web App : http://localhost:5173
echo ===================================================
pause
