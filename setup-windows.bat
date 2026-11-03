@echo off
setlocal enabledelayedexpansion

echo ===============================================================================
echo       ILMS - Intelligent Laboratory Management System (Windows Setup)
echo ===============================================================================
echo.

:: 1. Check Node.js
echo [1/5] Checking Node.js runtime installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js LTS (v18.0.0 or higher) from https://nodejs.org/
    echo Once installed, restart your terminal and run setup-windows.bat again.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo       Detected Node.js version: !NODE_VERSION!

:: 2. Check NPM
echo [2/5] Checking NPM package manager...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm package manager was not found.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo       Detected npm version: !NPM_VERSION!

:: 3. Check and setup .env configuration
echo [3/5] Verifying environment configuration (.env)...
if not exist ".env" (
    if exist ".env.example" (
        echo       Copying .env.example to .env (Default local fallback mode enabled)...
        copy .env.example .env >nul
        echo       Created .env file. You can configure real Firebase keys anytime.
    ) else (
        echo [WARNING] .env.example not found. Application will use default in-memory fallback.
    )
) else (
    echo       Existing .env file detected. Preserving existing configurations.
)

:: 4. Install dependencies using lockfile
echo [4/5] Installing project dependencies from package-lock.json...
echo       This may take a few moments depending on network speed...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install npm dependencies. Check internet connection and permissions.
    pause
    exit /b 1
)
echo       Dependencies successfully installed.

:: 5. Validation Check
echo [5/5] Running core validation test suite...
call npm test -- --run
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Some tests did not pass, but setup can continue.
) else (
    echo       All business workflow tests passed successfully!
)

echo.
echo ===============================================================================
echo   ILMS Setup Completed Successfully!
echo   Launching Development Server at http://localhost:5173
echo ===============================================================================
echo.

start "" "http://localhost:5173"
call npm run dev

pause
