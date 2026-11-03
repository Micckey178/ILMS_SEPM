@echo off
echo ===============================================================================
echo       Starting ILMS - Intelligent Laboratory Management System
echo ===============================================================================
echo.
echo Launching web application on http://localhost:5173 ...
start "" "http://localhost:5173"
call npm run dev
pause
