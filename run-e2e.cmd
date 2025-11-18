@echo off
REM Run full E2E flow for Wakili Pro (Windows)

REM 1. Start backend and frontend in the background
start "WakiliProDev" cmd /c "npm run dev"

REM 2. Wait for frontend to be ready (port 3000)
echo Waiting for frontend to be ready...
:waitloop
powershell -Command "try { $tcp = New-Object Net.Sockets.TcpClient('localhost', 3000); if ($tcp.Connected) { $tcp.Close(); exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
    timeout /t 1 >nul
    goto waitloop
)

REM 3. Run Playwright E2E tests
cd e2e
call npx playwright test
set E2E_STATUS=%ERRORLEVEL%
cd ..

REM 4. Kill dev servers (all node processes started by npm run dev)
taskkill /FI "WINDOWTITLE eq WakiliProDev*" /T /F >nul 2>&1

REM 5. Exit with E2E test status
exit /b %E2E_STATUS%
