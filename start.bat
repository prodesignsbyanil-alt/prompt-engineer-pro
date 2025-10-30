@echo off
setlocal EnableExtensions

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install LTS from https://nodejs.org/
  pause
  exit /b 1
)

if exist package-lock.json (
  echo Using npm ci (lockfile found)...
  call npm ci
) else (
  echo Installing dependencies (no lockfile)...
  call npm install
)

echo Starting Prompt Engineer Pro on http://localhost:3010 ...
set NEXT_TELEMETRY_DISABLED=1
call npm run dev
pause
