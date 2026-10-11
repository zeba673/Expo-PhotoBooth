@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instalalo desde https://nodejs.org/ y volve a abrir este archivo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando Expo PhotoBooth por primera vez...
  call npm install
  if errorlevel 1 (
    echo No se pudieron descargar las dependencias. Revisá la conexion a internet y volve a intentar.
    pause
    exit /b 1
  )
)
if exist data\server-port.txt del data\server-port.txt
start "Expo PhotoBooth" /D "%~dp0" cmd /k "npm run dev"
echo Esperando a que inicie Expo PhotoBooth...
for /L %%i in (1,1,30) do (
  if exist data\server-port.txt (
    set /p APP_PORT=<data\server-port.txt
    powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:!APP_PORT! -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
    if not errorlevel 1 (
      start "" http://localhost:!APP_PORT!
      exit /b 0
    )
  )
  timeout /t 1 /nobreak >nul
)
echo No se pudo iniciar el servidor. Revisa los mensajes de la ventana Expo PhotoBooth.
pause

