@echo off
REM PocketPilot Setup Script for Windows
REM This script automates the setup process

echo.
echo ============================================
echo    PocketPilot Setup Script
echo ============================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js found
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
) else (
    echo [OK] npm found
)

echo.

REM Install dependencies
echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)
echo [OK] Root dependencies installed

cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
echo [OK] Client dependencies installed

cd ..

echo.

REM Create .env file
echo Setting up environment...
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env file created
    echo [WARNING] Please edit .env file with your MongoDB URI and JWT secret
) else (
    echo [WARNING] .env file already exists
)

echo.

REM Create uploads directory
echo Creating uploads directory...
if not exist "uploads\receipts" mkdir "uploads\receipts"
echo [OK] Uploads directory created

echo.
echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Edit .env file with your MongoDB URI
echo 2. Start MongoDB service
echo 3. Run: npm run dev
echo.
echo Documentation:
echo - Quick Start: QUICKSTART.md
echo - API Docs: API_DOCS.md
echo - Deployment: DEPLOYMENT.md
echo.
echo After starting, access:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo.
echo Happy coding! [OK]
echo.
pause
