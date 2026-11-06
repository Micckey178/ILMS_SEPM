@echo off
title ILMS — Integrated Laboratory Management System
echo Launching ILMS Laboratory OS...
set "SCRIPT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\ILMS Laboratory System.lnk"

if not exist "%SHORTCUT_PATH%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=http://localhost:5173'; $s.IconLocation = '%SCRIPT_DIR%favicon.ico'; $s.Description = 'ILMS — Multi-Laboratory Operating System'; $s.Save()" 2>nul
)

start "" "msedge.exe" --app=http://localhost:5173
exit
