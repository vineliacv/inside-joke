@echo off
setlocal
cd /d "%~dp0"
title Inside Joke - servidor local

if not exist "package.json" (
  echo Coloca este archivo en la carpeta del juego, junto a package.json.
  pause
  exit /b 1
)
if not exist "node_modules\wrangler\bin\wrangler.js" (
  echo Faltan las dependencias del juego. Instala el proyecto primero.
  pause
  exit /b 1
)

echo Preparando la version actual del juego...
call npm.cmd run build
if errorlevel 1 goto :failed

echo Preparando las salas locales...
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --command "CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY NOT NULL, state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);"
if errorlevel 1 goto :failed

echo.
echo El juego abrira en http://localhost:3000
echo Para otra PC en el mismo Wi-Fi, usa la direccion IPv4 de esta PC seguida de :3000.
echo Para ver esa direccion, escribe ipconfig en otra ventana de PowerShell.
echo Manten esta ventana abierta mientras juegan. Para cerrar el juego, pulsa Ctrl+C.
echo.
start "" /min powershell.exe -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 0.0.0.0 --port 3000 --inspector-port 0
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo No se pudo iniciar el juego. Enviame una foto del error de esta ventana.
pause
exit /b 1
