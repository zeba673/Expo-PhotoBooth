@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js para iniciar Expo PhotoBooth.
  pause
  exit /b 1
)
if not exist "node_modules\.bin\electron.cmd" (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run desktop
if errorlevel 1 pause
